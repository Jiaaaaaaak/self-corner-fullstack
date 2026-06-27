"""
Agent Layer - Student Voice Pipeline
整合 OpenAI Realtime API 與 LiveKit，提供即時語音互動。
職責：學生語音回應 + 逐輪 semantic_analysis 情緒記錄。
"""
import asyncio
import os
import json
import base64
import websockets
from typing import Optional, Callable
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()  # 必須在所有 os.getenv() 之前呼叫，否則子進程讀不到 .env

from livekit import rtc
from livekit.agents import JobContext, JobRequest, WorkerOptions, cli

from agents.prompts import build_student_prompt, TOOLS_SCHEMA, build_semantic_analysis_prompt
from models import EmotionLog, Session, Scenario, StudentPersonality, Transcript, GradeLevel
from langchain_openai import ChatOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

# Worker 子進程需獨立建立 NullPool 引擎，避免 event loop 跨進程綁定問題
_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:P%40ssw0rd@localhost:5432/self_corner"
)
if _DATABASE_URL.startswith("postgres://"):
    _DATABASE_URL = _DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif _DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in _DATABASE_URL:
    _DATABASE_URL = _DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Supabase Transaction-mode pooler 不允許 prepared statement cache
_is_pooler = "pooler.supabase.com" in _DATABASE_URL or ":6543" in _DATABASE_URL
_connect_args = {"statement_cache_size": 0} if _is_pooler else {}

_worker_engine = create_async_engine(
    _DATABASE_URL,
    poolclass=NullPool,
    future=True,
    connect_args=_connect_args,
)
async_session_maker = async_sessionmaker(
    _worker_engine, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False
)

_local_analyzer_llm: Optional[ChatOpenAI] = None


def get_local_analyzer_llm() -> ChatOpenAI:
    """Lazy 載入 ChatOpenAI，避免父進程在 fork 子進程前就把 langchain 物件常駐
    在記憶體（Render Starter 512MB 對 livekit-agents stack 來說很緊）。
    """
    global _local_analyzer_llm
    if _local_analyzer_llm is None:
        _local_analyzer_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3)
    return _local_analyzer_llm

REALTIME_MODEL = "gpt-realtime"
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
        self.on_agent_transcript_delta: Optional[Callable[[str], None]] = None

    async def connect(self, system_prompt: str, voice: str = "alloy"):
        if not self.api_key:
            print("[OpenAI] ❌ 錯誤：找不到 API Key，請檢查 .env 檔案中的 OPENAI_API_KEY")
            return

        # GA Realtime API 不再需要（也不接受）beta shape；送出 beta header 會被
        # 以 invalid_request_error.beta_api_shape_disabled 關閉連線。
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        try:
            print(f"[OpenAI] 正在嘗試連線至: {self.url}")
            # 設定連線超時，避免無限等待
            self.ws = await asyncio.wait_for(
                websockets.connect(self.url, additional_headers=headers), 
                timeout=10.0
            )
            print("[OpenAI] ✅ WebSocket 握手成功！連線已建立。")

            # 初始 Session 更新（GA Realtime API 格式：audio 設定改為 input/output 巢狀）
            await self.send_event({
                "type": "session.update",
                "session": {
                    "type": "realtime",
                    "instructions": system_prompt,
                    "output_modalities": ["audio"],
                    "audio": {
                        "input": {
                            "format": {"type": "audio/pcm", "rate": SAMPLE_RATE},
                            "transcription": {"model": "whisper-1"},
                            "turn_detection": {"type": "server_vad"},
                        },
                        "output": {
                            "format": {"type": "audio/pcm", "rate": SAMPLE_RATE},
                            "voice": voice,
                        },
                    },
                    "tools": TOOLS_SCHEMA,
                    "tool_choice": "auto",
                },
            })
            print("[OpenAI] ✅ 初始 Session 指令已送出")

        except websockets.exceptions.InvalidStatusCode as e:
            print(f"[OpenAI] ❌ 連線被拒絕！HTTP 狀態碼: {e.status_code}")
            if e.status_code == 401:
                print("   👉 提示：API Key 可能無效。")
            elif e.status_code == 403:
                print("   👉 提示：您的 OpenAI 帳號可能沒有 Realtime API 的使用權限（通常需 Tier 5）。")
            elif e.status_code == 429:
                print("   👉 提示：額度不足或觸發頻率限制。")
            self.ws = None
            raise
        except asyncio.TimeoutError:
            print("[OpenAI] ❌ 連線超時，請檢查網路環境或代理伺服器設定。")
            self.ws = None
            raise
        except Exception as e:
            print(f"[OpenAI] ❌ 連線發生未預期錯誤: {type(e).__name__}: {e}")
            self.ws = None
            raise

    async def send_event(self, event: dict):
        if not self.ws:
            print("[OpenAI] ⚠️ 警告：嘗試在未連線狀態下發送事件。")
            return
        
        try:
            await self.ws.send(json.dumps(event))
        except Exception as e:
            # 這裡就是抓取你之前噴出 error 的地方
            state = getattr(self.ws, 'state', 'Unknown')
            print(f"[OpenAI] ❌ 發送事件失敗！WS 狀態: {state}, 錯誤: {e}")
            raise

    async def send_audio_append(self, pcm_b64: str):
        await self.send_event({
            "type": "input_audio_buffer.append",
            "audio": pcm_b64,
        })

    async def loop(self):
        if not self.ws:
            return
        try:
            async for message in self.ws:
                data = json.loads(message)
                event_type = data.get("type")

                if event_type != "response.output_audio.delta":
                    print(f"[OpenAI Event] {event_type}")

                if event_type == "response.output_audio.delta":
                    delta_b64 = data.get("delta")
                    if delta_b64 and self.on_audio_delta:
                        await self.on_audio_delta(base64.b64decode(delta_b64))

                elif event_type == "conversation.item.input_audio_transcription.completed":
                    transcript = data.get("transcript")
                    print(f"[OpenAI] Transcription completed, transcript={repr(transcript)}")
                    if transcript and self.on_user_transcription:
                        await self.on_user_transcription(transcript)

                elif event_type == "conversation.item.input_audio_transcription.failed":
                    print(f"[OpenAI] ⚠️ 語音轉文字失敗: {data}")

                elif event_type == "error":
                    print(f"[OpenAI] ⚠️ 收到 API 錯誤事件: {data}")

                elif event_type == "response.function_call_arguments.done":
                    call_id = data.get("call_id")
                    function_name = data.get("name")
                    arguments = json.loads(data.get("arguments", "{}"))

                    result = ""
                    if function_name == "semantic_analysis":
                        try:
                            result = await self.pipeline.exec_semantic_analysis(
                                arguments.get("teacher_input", "")
                            )
                        except Exception as sa_err:
                            print(f"[OpenAI] ⚠️ semantic_analysis error: {sa_err}, using fallback emotions")
                            result = json.dumps(self.pipeline.last_emotion_scores or {})

                    await self.send_event({
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": result,
                        },
                    })
                    await self.send_event({"type": "response.create"})

                elif event_type == "response.output_audio_transcript.delta":
                    delta = data.get("delta", "")
                    if delta and self.on_agent_transcript_delta:
                        await self.on_agent_transcript_delta(delta)

                elif event_type == "response.output_item.done":
                    item = data.get("item", {})
                    for c in item.get("content", []):
                        # GA Realtime 的音訊輸出 content 型別為 "output_audio"（舊 beta 為 "audio"）。
                        # 此事件是每一輪回應的定稿訊號，前端據此把串流泡泡收尾、另開新泡泡。
                        if c.get("type") in ("audio", "output_audio") and "transcript" in c:
                            if self.on_agent_response:
                                await self.on_agent_response(c["transcript"])

        except websockets.exceptions.ConnectionClosed as e:
            print(f"[OpenAI] ℹ️ 連線已正常或非預期關閉: {e.code} {e.reason}")
        except Exception as e:
            print(f"[OpenAI] ❌ 迴圈發生錯誤: {e}")


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
        self.scenario_description: str = ""
        self.personality_type: str = ""
        self.domain_weights: dict = {}
        self.personality_voice: str = "alloy"

    async def _load_dynamic_prompt(self) -> Optional[str]:
        room_name = self.room.name
        print(f"[Pipeline] Loading prompt for room: {room_name!r}")

        for attempt in range(3):
            try:
                async with async_session_maker() as db:
                    result = await db.execute(
                        select(Session).where(Session.livekit_room_name == room_name)
                    )
                    session = result.scalar_one_or_none()

                    if not session:
                        if attempt < 2:
                            print(f"[Pipeline] Session not found, retrying in 1s... (attempt {attempt+1})")
                            await asyncio.sleep(1)
                            continue
                        print(f"[Pipeline] WARNING: Session not found for room: {room_name!r}")
                        break

                    self.db_session_id = session.id

                    scenario = None
                    if session.scenario_id:
                        r = await db.execute(select(Scenario).where(Scenario.id == session.scenario_id))
                        scenario = r.scalar_one_or_none()

                    personality = None
                    if session.personality_id:
                        r = await db.execute(select(StudentPersonality).where(StudentPersonality.id == session.personality_id))
                        personality = r.scalar_one_or_none()

                    if scenario and personality:
                        self.scenario_title = scenario.title
                        self.scenario_description = scenario.description or scenario.title
                        self.personality_type = personality.personality_type or ""
                        self.domain_weights = personality.domain_weights or {}
                        self.personality_voice = personality.voice or "alloy"
                        self.last_emotion_scores = scenario.initial_emotions or {
                            "HAPPY": 0.10, "SAD": 0.20, "ANGRY": 0.05, "SURPRISED": 0.05,
                            "ANXIOUS": 0.30, "FRUSTRATED": 0.15, "CONFIDENT": 0.10,
                            "CURIOUS": 0.15, "NEUTRAL": 0.40,
                        }
                        grade = None
                        if session.session_metadata:
                            grade_id = session.session_metadata.get("grade_id")
                            if grade_id:
                                r = await db.execute(select(GradeLevel).where(GradeLevel.id == grade_id))
                                grade = r.scalar_one_or_none()

                        grade_label = f"{grade.label}（{grade.desc}）" if grade else "未指定年級"
                        print(
                            f"[Pipeline] ✅ Session 載入成功\n"
                            f"           學生：{personality.name}（{personality.personality_type or '未知個性'}）\n"
                            f"           年級：{grade_label}\n"
                            f"           場景：{scenario.title}"
                        )
                        return build_student_prompt(scenario, personality, grade=grade)

                    break

            except Exception as e:
                print(f"[Pipeline] DB error: {e}")
                break

        print(f"[Pipeline] ❌ 無法載入 Session 設定（room: {room_name!r}），中止任務。")
        return None

    async def start(self):
        # 1. 先連接 LiveKit 房間
        await self.ctx.connect()
        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        await self.room.local_participant.publish_track(self.track, options)

        # 2. 載入 Prompt 並連接 OpenAI
        system_prompt = await self._load_dynamic_prompt()

        if system_prompt is None:
            try:
                error_payload = json.dumps({
                    "type": "pipeline_error",
                    "code": "session_load_failed",
                    "message": "無法載入對話設定，請返回重新選擇",
                }).encode("utf-8")
                await self.room.local_participant.publish_data(error_payload, reliable=True)
                await asyncio.sleep(0.5)  # 給 LiveKit 時間傳遞訊息
            except Exception as e:
                print(f"[Pipeline] ⚠️ 無法傳送錯誤訊號: {e}")
            return

        try:
            await self.client.connect(system_prompt, voice=self.personality_voice)
        except Exception:
            print("[Pipeline] ❌ 關鍵錯誤：無法初始化 OpenAI 連線，中斷任務。")
            return

        self.client.on_audio_delta = self.handle_audio_delta
        self.client.on_agent_response = self.handle_agent_text_response
        self.client.on_user_transcription = self.handle_user_transcription
        self.client.on_agent_transcript_delta = self.handle_agent_transcript_delta

        # 3. 啟動非同步監聽迴圈
        audio_task = asyncio.create_task(self.client.loop())

        # 4. 註冊事件監聽
        @self.room.on("track_subscribed")
        def on_track_subscribed(track, publication, participant):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                asyncio.create_task(self.handle_track_audio(track))

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

        # 主動掃描音軌
        for participant in self.room.remote_participants.values():
            for publication in participant.track_publications.values():
                if publication.kind == rtc.TrackKind.KIND_AUDIO:
                    if not publication.subscribed:
                        publication.set_subscribed(True)
                    if publication.track:
                        asyncio.create_task(self.handle_track_audio(publication.track))

        shutdown_future: asyncio.Future = asyncio.Future()

        @self.room.on("participant_disconnected")
        def on_participant_disconnected(_participant):
            async def _delayed_shutdown():
                await asyncio.sleep(5)
                if not self.room.remote_participants and not shutdown_future.done():
                    print("[Pipeline] 參與者已離開超過 5 秒，觸發關閉。")
                    shutdown_future.set_result("participant_disconnected")
            asyncio.create_task(_delayed_shutdown())

        async def _on_shutdown(reason: str = ""):
            if not shutdown_future.done():
                shutdown_future.set_result(reason or "framework_shutdown")

        self.ctx.add_shutdown_callback(_on_shutdown)

        await shutdown_future

        audio_task.cancel()
        if self.client.ws:
            await self.client.ws.close()

    async def handle_audio_delta(self, pcm_data: bytes):
        samples_count = len(pcm_data) // 2
        frame = rtc.AudioFrame(data=pcm_data, sample_rate=SAMPLE_RATE, num_channels=CHANNELS, samples_per_channel=samples_count)
        await self.source.capture_frame(frame)

    async def handle_agent_transcript_delta(self, delta: str):
        payload = json.dumps({"type": "agent_transcript_delta", "delta": delta}).encode("utf-8")
        await self.room.local_participant.publish_data(payload, reliable=True)

    async def handle_agent_text_response(self, text: str):
        if self.db_session_id:
            async with async_session_maker() as db:
                db.add(Transcript(session_id=self.db_session_id, speaker="student", text=text, source="realtime"))
                await db.commit()
        payload = json.dumps({"type": "agent_response", "text": text}).encode("utf-8")
        await self.room.local_participant.publish_data(payload, reliable=True)

    async def handle_user_transcription(self, text: str):
        if self.db_session_id:
            async with async_session_maker() as db:
                db.add(Transcript(session_id=self.db_session_id, speaker="teacher", text=text, source="realtime"))
                await db.commit()
        payload = json.dumps({"type": "user_transcription", "text": text}).encode("utf-8")
        await self.room.local_participant.publish_data(payload, reliable=True)

    async def handle_teacher_text_input(self, text: str):
        if self.db_session_id:
            async with async_session_maker() as db:
                db.add(Transcript(session_id=self.db_session_id, speaker="teacher", text=text, source="text"))
                await db.commit()
        await self.client.send_event({
            "type": "conversation.item.create",
            "item": {"type": "message", "role": "user", "content": [{"type": "input_text", "text": text}]},
        })
        await self.client.send_event({"type": "response.create"})

    async def handle_track_audio(self, track: rtc.RemoteAudioTrack):
        audio_stream = rtc.AudioStream(track, sample_rate=SAMPLE_RATE)
        async for frame in audio_stream:
            if not self.client.ws: break
            pcm_b64 = base64.b64encode(frame.frame.data).decode("utf-8")
            await self.client.send_audio_append(pcm_b64)

    async def exec_semantic_analysis(self, teacher_input: str) -> str:
        # (保持原有的情緒分析邏輯...)
        self.turn_count += 1
        prompt = build_semantic_analysis_prompt(
            teacher_input,
            self.last_emotion_scores,
            self.scenario_description,
            self.personality_type,
            self.domain_weights,
        )
        response = await get_local_analyzer_llm().ainvoke(prompt)
        emotion_json_str = response.content
        try:
            emotion_scores = json.loads(emotion_json_str)
            self.last_emotion_scores = emotion_scores
            if self.db_session_id:
                async with async_session_maker() as db:
                    db.add(EmotionLog(session_id=self.db_session_id, turn_number=self.turn_count, teacher_input=teacher_input, 
                                      timestamp=datetime.utcnow(), **{k.lower(): v for k, v in emotion_scores.items()}))
                    await db.commit()
        except Exception as e:
            print(f"[Pipeline] ⚠️ 情緒 log 寫入失敗（turn {self.turn_count}）: {e}")
        return emotion_json_str

# =============================================================================
# LiveKit Worker Entry Points
# =============================================================================

async def entrypoint(ctx: JobContext):
    print(f"[Worker] entrypoint started, room={ctx.room.name if ctx.room else 'unknown'}", flush=True)
    pipeline = StudentVoicePipeline(ctx)
    await pipeline.start()

async def request_fnc(ctx: JobRequest):
    print(f"[Worker] received job request, room={ctx.room.name if ctx.room else 'unknown'}", flush=True)
    await ctx.accept()
    print(f"[Worker] job accepted", flush=True)

AGENT_NAME = os.getenv("LIVEKIT_AGENT_NAME", "selfcorner-student")

if __name__ == "__main__":
    # 預設保留 idle 子進程以加快首個 job；Render Starter (512MB)
    # 記憶體吃緊，可用 WORKER_NUM_IDLE_PROCESSES=0 關閉預熱。
    num_idle = int(os.getenv("WORKER_NUM_IDLE_PROCESSES", "0"))
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fnc,
            # livekit-agents 1.x：設 agent_name + API 端 explicit dispatch，
            # 比依賴 anonymous worker auto-dispatch 可靠。
            agent_name=AGENT_NAME,
            initialize_process_timeout=120.0,
            num_idle_processes=num_idle,
        )
    )