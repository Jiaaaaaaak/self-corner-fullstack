"""
Agent Layer - Student Voice Pipeline
整合 OpenAI Realtime API 與 LiveKit，提供即時語音互動。
職責：學生語音回應 + 逐輪 semantic_analysis 情緒記錄。
（教練分析由 Session 結束的 REST API 觸發，不在此處處理）
"""
import asyncio
import os
import json
import base64
import websockets
from typing import Optional, Callable
from datetime import datetime
from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import JobContext, JobRequest, WorkerOptions, cli

from agents.prompts import build_student_prompt, TOOLS_SCHEMA, build_semantic_analysis_prompt
from database import async_session_maker
from models import EmotionLog, Session, Scenario, StudentPersonality, Transcript
from langchain_openai import ChatOpenAI
from sqlalchemy import select

load_dotenv()

local_analyzer_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3)

REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17"
SAMPLE_RATE = 24000
CHANNELS = 1


class OpenAIRealtimeClient:
    """管理與 OpenAI Realtime API 的 WebSocket 連線"""

    def __init__(self, api_key: str, pipeline_instance):
        self.url = f"wss://api.openai.com/v1/realtime?model={REALTIME_MODEL}"
        self.api_key = api_key
        self.pipeline = pipeline_instance
        self.ws: Optional[websockets.WebSocketClientProtocol] = None

        self.on_audio_delta: Optional[Callable[[bytes], None]] = None
        self.on_user_transcription: Optional[Callable[[str], None]] = None
        self.on_agent_response: Optional[Callable[[str], None]] = None

    async def connect(self, system_prompt: str):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "realtime=v1",
        }
        self.ws = await websockets.connect(self.url, additional_headers=headers)
        print("[OpenAI] Connected!")

        await self.send_event({
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "voice": "alloy",
                "instructions": system_prompt,
                "tools": TOOLS_SCHEMA,
                "tool_choice": "auto",
                "turn_detection": {"type": "server_vad"},
                "input_audio_transcription": {"model": "whisper-1"},
            },
        })

    async def send_event(self, event: dict):
        if self.ws:
            await self.ws.send(json.dumps(event))

    async def send_audio_append(self, pcm_b64: str):
        await self.send_event({
            "type": "input_audio_buffer.append",
            "audio": pcm_b64,
        })

    async def loop(self):
        try:
            async for message in self.ws:
                data = json.loads(message)
                event_type = data.get("type")

                # 診斷：印出所有非音訊 delta 的事件類型
                if event_type != "response.audio.delta":
                    print(f"[OpenAI Event] {event_type}")

                if event_type == "response.audio.delta":
                    delta_b64 = data.get("delta")
                    if delta_b64 and self.on_audio_delta:
                        await self.on_audio_delta(base64.b64decode(delta_b64))

                elif event_type == "conversation.item.input_audio_transcription.completed":
                    transcript = data.get("transcript")
                    print(f"[OpenAI] Transcription completed, transcript={repr(transcript)}")
                    if transcript and self.on_user_transcription:
                        await self.on_user_transcription(transcript)

                elif event_type == "conversation.item.input_audio_transcription.failed":
                    print(f"[OpenAI] ⚠️ Transcription FAILED: {data}")

                elif event_type == "error":
                    print(f"[OpenAI] ⚠️ ERROR event: {data}")

                elif event_type == "response.function_call_arguments.done":
                    call_id = data.get("call_id")
                    function_name = data.get("name")
                    arguments = json.loads(data.get("arguments", "{}"))

                    result = ""
                    if function_name == "semantic_analysis":
                        result = await self.pipeline.exec_semantic_analysis(
                            arguments.get("teacher_input", "")
                        )

                    await self.send_event({
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": result,
                        },
                    })
                    await self.send_event({"type": "response.create"})

                elif event_type == "response.output_item.done":
                    item = data.get("item", {})
                    for c in item.get("content", []):
                        if c.get("type") == "audio" and "transcript" in c:
                            if self.on_agent_response:
                                await self.on_agent_response(c["transcript"])

        except Exception as e:
            print(f"[OpenAI] Error in loop: {e}")


class StudentVoicePipeline:
    """學生語音互動管線（LiveKit ↔ OpenAI Realtime API）"""

    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.room = ctx.room
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAIRealtimeClient(self.api_key, self)

        self.source = rtc.AudioSource(SAMPLE_RATE, CHANNELS)
        self.track = rtc.LocalAudioTrack.create_audio_track("student_voice", self.source)

        self.turn_count = 0
        self.db_session_id: Optional[int] = None
        self.last_emotion_scores: dict = {}
        self.scenario_title: str = ""

    async def _resolve_session_id(self) -> Optional[int]:
        """透過 LiveKit room name 查詢對應的 Session ID"""
        room_name = self.room.name
        async with async_session_maker() as db:
            result = await db.execute(
                select(Session).where(Session.livekit_room_name == room_name)
            )
            session = result.scalar_one_or_none()
            return session.id if session else None

    async def _load_dynamic_prompt(self) -> str:
        """從 DB 讀取情境與學生個性，組裝動態 Prompt"""
        room_name = self.room.name
        print(f"[Pipeline] Loading prompt for room: {room_name!r}")

        try:
            async with async_session_maker() as db:
                result = await db.execute(
                    select(Session).where(Session.livekit_room_name == room_name)
                )
                session = result.scalar_one_or_none()

                if not session:
                    print(f"[Pipeline] WARNING: Session not found for room: {room_name!r}")
                    return "請務必使用繁體中文（台灣用語）。你是一位國中一年級的學生，與老師進行 SEL 對話練習，請自然地回應老師。"

                print(f"[Pipeline] Session found: id={session.id}, scenario_id={session.scenario_id}, personality_id={session.personality_id}")
                self.db_session_id = session.id

                scenario = None
                if session.scenario_id:
                    r = await db.execute(
                        select(Scenario).where(Scenario.id == session.scenario_id)
                    )
                    scenario = r.scalar_one_or_none()
                    print(f"[Pipeline] Scenario: {scenario.title if scenario else 'NOT FOUND'}")

                personality = None
                if session.personality_id:
                    r = await db.execute(
                        select(StudentPersonality).where(
                            StudentPersonality.id == session.personality_id
                        )
                    )
                    personality = r.scalar_one_or_none()
                    print(f"[Pipeline] Personality: {personality.name if personality else 'NOT FOUND'}")

        except Exception as e:
            print(f"[Pipeline] DB error in _load_dynamic_prompt: {e}")
            return "請務必使用繁體中文（台灣用語）。你是一位國中一年級的學生，與老師進行 SEL 對話練習，請自然地回應老師。"

        if scenario and personality:
            self.scenario_title = scenario.title
            # 使用情境預設的初始情緒；若無則使用通用基準值
            self.last_emotion_scores = scenario.initial_emotions or {
                "HAPPY": 0.10, "SAD": 0.20, "ANGRY": 0.05, "SURPRISED": 0.05,
                "ANXIOUS": 0.30, "FRUSTRATED": 0.15, "CONFIDENT": 0.10,
                "CURIOUS": 0.15, "NEUTRAL": 0.40,
            }
            print("[Pipeline] Dynamic prompt assembled successfully.")
            return build_student_prompt(scenario, personality, session.age_group or "國中")

        print("[Pipeline] WARNING: Missing scenario or personality, using fallback prompt.")
        return "請務必使用繁體中文（台灣用語）。你是一位國中一年級的學生，正在與老師進行 SEL 對話練習。請自然地回應老師。"

    async def start(self):
        await self.ctx.connect()
        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        await self.room.local_participant.publish_track(self.track, options)

        system_prompt = await self._load_dynamic_prompt()
        await self.client.connect(system_prompt)

        self.client.on_audio_delta = self.handle_audio_delta
        self.client.on_agent_response = self.handle_agent_text_response
        self.client.on_user_transcription = self.handle_user_transcription

        audio_task = asyncio.create_task(self.client.loop())

        @self.room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.TrackPublication,
            participant: rtc.RemoteParticipant,
        ):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                print(f"[Pipeline] track_subscribed: audio from {participant.identity}")
                asyncio.create_task(self.handle_track_audio(track))

        @self.room.on("track_published")
        def on_track_published(
            publication: rtc.TrackPublication,
            participant: rtc.RemoteParticipant,
        ):
            if publication.kind == rtc.TrackKind.KIND_AUDIO:
                print(f"[Pipeline] track_published: audio from {participant.identity}, subscribing...")
                publication.set_subscribed(True)

        @self.room.on("data_received")
        def on_data_received(data_packet: rtc.DataPacket):
            try:
                message = json.loads(bytes(data_packet.data).decode("utf-8"))
                if message.get("type") == "teacher_text_input":
                    text = message.get("text", "").strip()
                    if text:
                        asyncio.create_task(self.handle_teacher_text_input(text))
            except Exception:
                pass

        # Agent 可能晚於 Teacher 加入房間，需主動掃描已存在的音軌
        print(f"[Pipeline] Scanning {len(self.room.remote_participants)} existing participant(s)...")
        for participant in self.room.remote_participants.values():
            for publication in participant.track_publications.values():
                if publication.kind == rtc.TrackKind.KIND_AUDIO:
                    print(f"[Pipeline] Found existing audio track from {participant.identity}.")
                    if not publication.subscribed:
                        publication.set_subscribed(True)
                    if publication.track:
                        asyncio.create_task(self.handle_track_audio(publication.track))

        shutdown_future = asyncio.Future()

        async def _on_shutdown(reason: str):
            if not shutdown_future.done():
                shutdown_future.set_result(reason)

        self.ctx.add_shutdown_callback(_on_shutdown)
        await shutdown_future

        audio_task.cancel()
        if self.client.ws:
            await self.client.ws.close()

    # =========================================================================
    # Tool Execution
    # =========================================================================

    async def exec_semantic_analysis(self, teacher_input: str) -> str:
        self.turn_count += 1
        print(f"[Tool] semantic_analysis turn={self.turn_count}: {teacher_input[:50]}...")

        prompt = build_semantic_analysis_prompt(
            teacher_input=teacher_input,
            previous_emotions=self.last_emotion_scores,
            scenario_title=self.scenario_title,
        )
        response = await local_analyzer_llm.ainvoke(prompt)
        emotion_json_str = response.content

        try:
            emotion_scores = json.loads(emotion_json_str)
            self.last_emotion_scores = emotion_scores
            if self.db_session_id:
                async with async_session_maker() as db:
                    log = EmotionLog(
                        session_id=self.db_session_id,
                        turn_number=self.turn_count,
                        teacher_input=teacher_input,
                        timestamp=datetime.utcnow(),
                        happy=emotion_scores.get("HAPPY", 0.0),
                        sad=emotion_scores.get("SAD", 0.0),
                        angry=emotion_scores.get("ANGRY", 0.0),
                        surprised=emotion_scores.get("SURPRISED", 0.0),
                        anxious=emotion_scores.get("ANXIOUS", 0.0),
                        frustrated=emotion_scores.get("FRUSTRATED", 0.0),
                        confident=emotion_scores.get("CONFIDENT", 0.0),
                        curious=emotion_scores.get("CURIOUS", 0.0),
                        neutral=emotion_scores.get("NEUTRAL", 0.0),
                    )
                    db.add(log)
                    await db.commit()
        except Exception as e:
            print(f"[DB Error] EmotionLog: {e}")

        return emotion_json_str

    # =========================================================================
    # Audio & Data Handlers
    # =========================================================================

    async def handle_audio_delta(self, pcm_data: bytes):
        samples_count = len(pcm_data) // 2
        frame = rtc.AudioFrame(
            data=pcm_data,
            sample_rate=SAMPLE_RATE,
            num_channels=CHANNELS,
            samples_per_channel=samples_count,
        )
        await self.source.capture_frame(frame)

    async def handle_agent_text_response(self, text: str):
        """學生回應文字 → 存入 Transcript + 發布到 LiveKit 資料頻道"""
        if self.db_session_id:
            async with async_session_maker() as db:
                db.add(Transcript(
                    session_id=self.db_session_id,
                    speaker="student",
                    text=text,
                    source="realtime",
                ))
                await db.commit()

        payload = json.dumps({"type": "agent_response", "text": text}).encode("utf-8")
        await self.room.local_participant.publish_data(payload, reliable=True)

    async def handle_user_transcription(self, text: str):
        """老師語音轉文字 → 存入 Transcript + 發布到 LiveKit 資料頻道"""
        print(f"[Pipeline] Teacher transcription: {text[:80]}")
        if self.db_session_id:
            async with async_session_maker() as db:
                db.add(Transcript(
                    session_id=self.db_session_id,
                    speaker="teacher",
                    text=text,
                    source="realtime",
                ))
                await db.commit()

        payload = json.dumps({"type": "user_transcription", "text": text}).encode("utf-8")
        await self.room.local_participant.publish_data(payload, reliable=True)

    async def handle_teacher_text_input(self, text: str):
        """老師文字輸入 → 存入 Transcript + 注入 OpenAI Realtime API 觸發學生回應"""
        print(f"[Pipeline] Teacher text input: {text[:80]}")

        if self.db_session_id:
            async with async_session_maker() as db:
                db.add(Transcript(
                    session_id=self.db_session_id,
                    speaker="teacher",
                    text=text,
                    source="text",
                ))
                await db.commit()

        # 注入文字訊息並觸發回應
        await self.client.send_event({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": text}],
            },
        })
        await self.client.send_event({"type": "response.create"})

    async def handle_track_audio(self, track: rtc.RemoteAudioTrack):
        audio_stream = rtc.AudioStream(track, sample_rate=SAMPLE_RATE)
        frame_count = 0
        async for frame in audio_stream:
            pcm_b64 = base64.b64encode(frame.frame.data).decode("utf-8")
            await self.client.send_audio_append(pcm_b64)
            frame_count += 1
            if frame_count == 1:
                print(f"[Pipeline] ✅ First audio frame received from teacher — audio is flowing!")
            elif frame_count % 200 == 0:
                print(f"[Pipeline] Audio frames received: {frame_count}")


# =============================================================================
# LiveKit Worker Entry Points
# =============================================================================

async def entrypoint(ctx: JobContext):
    pipeline = StudentVoicePipeline(ctx)
    await pipeline.start()


async def request_fnc(ctx: JobRequest):
    await ctx.accept()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, request_fnc=request_fnc))
