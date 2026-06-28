"""
Agent Layer - Student Voice Pipeline（官方 livekit-plugins-openai 版本）

以 AgentSession + openai.realtime.RealtimeModel + @function_tool 取代原本手刻的
OpenAIRealtimeClient（保留於 voice_pipeline_legacy.py 作為 fallback）。

保留與原版完全相同的四個客製點：
  1. DB 動態載入 prompt（依 room 名稱查 Session/Scenario/Personality/Grade）
  2. semantic_analysis 工具：每輪呼叫本地 LLM 算情緒、寫入 EmotionLog
  3. 逐字稿即時透過 LiveKit data channel 推前端（沿用相同 JSON 格式）
  4. teacher 文字輸入（data channel 收 teacher_text_input）觸發學生回應

前端 data channel 合約（與 legacy 版一致，前端不需修改）：
  送出：{type:"agent_transcript_delta", delta}  逐字串流
        {type:"agent_response", text}           本輪定稿
        {type:"user_transcription", text}        老師語音轉文字
        {type:"pipeline_error", code, message}   載入失敗
  接收：{type:"teacher_text_input", text}        老師打字
"""
import asyncio
import os
import json
from typing import AsyncIterable, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()  # 必須在所有 os.getenv() 之前呼叫，否則子進程讀不到 .env

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobRequest,
    WorkerOptions,
    RunContext,
    cli,
    function_tool,
)
from livekit.agents.voice.events import (
    ConversationItemAddedEvent,
    UserInputTranscribedEvent,
)
from livekit.plugins import openai
from openai.types.realtime import AudioTranscription

from agents.prompts import build_student_prompt, build_semantic_analysis_prompt
from models import EmotionLog, Session, Scenario, StudentPersonality, Transcript, GradeLevel
from langchain_openai import ChatOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

# =============================================================================
# DB 引擎（Worker 子進程獨立建立 NullPool 引擎，避免 event loop 跨進程綁定）
# =============================================================================
_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:P%40ssw0rd@localhost:5432/self_corner",
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
    """Lazy 載入 ChatOpenAI，避免父進程在 fork 子進程前就把 langchain 物件常駐記憶體。"""
    global _local_analyzer_llm
    if _local_analyzer_llm is None:
        _local_analyzer_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3)
    return _local_analyzer_llm


REALTIME_MODEL = "gpt-realtime"

_DEFAULT_EMOTIONS = {
    "HAPPY": 0.10, "SAD": 0.20, "ANGRY": 0.05, "SURPRISED": 0.05,
    "ANXIOUS": 0.30, "FRUSTRATED": 0.15, "CONFIDENT": 0.10,
    "CURIOUS": 0.15, "NEUTRAL": 0.40,
}


# =============================================================================
# Student Agent
# =============================================================================
class StudentAgent(Agent):
    """模擬學生的 Agent：持有本次 Session 的情境/個性狀態，並提供 semantic_analysis 工具。"""

    def __init__(
        self,
        *,
        instructions: str,
        room: rtc.Room,
        db_session_id: Optional[int],
        scenario_description: str,
        personality_type: str,
        domain_weights: dict,
        initial_emotions: dict,
    ):
        super().__init__(instructions=instructions)
        self._room = room
        self.db_session_id = db_session_id
        self.scenario_description = scenario_description
        self.personality_type = personality_type
        self.domain_weights = domain_weights or {}
        self.last_emotion_scores = initial_emotions or dict(_DEFAULT_EMOTIONS)
        self.turn_count = 0

    async def publish(self, payload: dict):
        """透過 LiveKit data channel 推訊息給前端（沿用 legacy JSON 格式）。"""
        try:
            await self._room.local_participant.publish_data(
                json.dumps(payload).encode("utf-8"), reliable=True
            )
        except Exception as e:
            print(f"[Pipeline] ⚠️ publish_data 失敗: {e}", flush=True)

    async def transcription_node(
        self, text: AsyncIterable[str], model_settings
    ) -> AsyncIterable[str]:
        """覆寫框架的逐字稿節點：把學生每個文字 chunk 即時推到 data channel
        （agent_transcript_delta），同時原樣 yield 回框架，不影響預設轉錄行為。"""
        async def _tee():
            async for chunk in text:
                if chunk:
                    await self.publish({"type": "agent_transcript_delta", "delta": str(chunk)})
                yield chunk

        return _tee()

    @function_tool
    async def semantic_analysis(self, context: RunContext, teacher_input: str) -> str:
        """分析老師剛剛說的話對你（學生）造成的內心感受與情緒強度。
        在你回應老師的任何一句話之前都必須先呼叫此工具。

        Args:
            teacher_input: 老師剛剛說的完整一句話。
        """
        self.turn_count += 1
        prompt = build_semantic_analysis_prompt(
            teacher_input,
            self.last_emotion_scores,
            self.scenario_description,
            self.personality_type,
            self.domain_weights,
        )
        try:
            response = await get_local_analyzer_llm().ainvoke(prompt)
            emotion_json_str = response.content
            emotion_scores = json.loads(emotion_json_str)
            self.last_emotion_scores = emotion_scores
            if self.db_session_id:
                async with async_session_maker() as db:
                    db.add(EmotionLog(
                        session_id=self.db_session_id,
                        turn_number=self.turn_count,
                        teacher_input=teacher_input,
                        timestamp=datetime.utcnow(),
                        **{k.lower(): v for k, v in emotion_scores.items()},
                    ))
                    await db.commit()
            return emotion_json_str
        except Exception as e:
            print(f"[Pipeline] ⚠️ semantic_analysis error: {e}，使用上一輪情緒 fallback", flush=True)
            return json.dumps(self.last_emotion_scores or {})


# =============================================================================
# DB Session 設定載入（沿用 legacy 的 retry 邏輯）
# =============================================================================
async def _load_session_config(room_name: str) -> Optional[dict]:
    """依 room 名稱載入 Session/Scenario/Personality/Grade，組裝 prompt 與初始狀態。
    回傳 dict；找不到或失敗回傳 None。"""
    print(f"[Pipeline] Loading prompt for room: {room_name!r}", flush=True)

    for attempt in range(3):
        try:
            async with async_session_maker() as db:
                result = await db.execute(
                    select(Session).where(Session.livekit_room_name == room_name)
                )
                session = result.scalar_one_or_none()

                if not session:
                    if attempt < 2:
                        print(f"[Pipeline] Session not found, retrying in 1s... (attempt {attempt+1})", flush=True)
                        await asyncio.sleep(1)
                        continue
                    print(f"[Pipeline] WARNING: Session not found for room: {room_name!r}", flush=True)
                    return None

                scenario = None
                if session.scenario_id:
                    r = await db.execute(select(Scenario).where(Scenario.id == session.scenario_id))
                    scenario = r.scalar_one_or_none()

                personality = None
                if session.personality_id:
                    r = await db.execute(select(StudentPersonality).where(StudentPersonality.id == session.personality_id))
                    personality = r.scalar_one_or_none()

                if not (scenario and personality):
                    return None

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
                    f"           場景：{scenario.title}",
                    flush=True,
                )

                return {
                    "system_prompt": build_student_prompt(scenario, personality, grade=grade),
                    "db_session_id": session.id,
                    "personality_voice": personality.voice or "alloy",
                    "scenario_description": scenario.description or scenario.title,
                    "personality_type": personality.personality_type or "",
                    "domain_weights": personality.domain_weights or {},
                    "initial_emotions": scenario.initial_emotions or dict(_DEFAULT_EMOTIONS),
                }

        except Exception as e:
            print(f"[Pipeline] DB error: {e}", flush=True)
            return None

    return None


# =============================================================================
# DB 寫入 helper
# =============================================================================
async def _write_transcript(db_session_id: Optional[int], speaker: str, text: str, source: str):
    if not db_session_id:
        return
    async with async_session_maker() as db:
        db.add(Transcript(session_id=db_session_id, speaker=speaker, text=text, source=source))
        await db.commit()


# =============================================================================
# LiveKit Worker Entry Points
# =============================================================================
async def entrypoint(ctx: JobContext):
    print(f"[Worker] entrypoint started, room={ctx.room.name if ctx.room else 'unknown'}", flush=True)
    await ctx.connect()
    room_name = ctx.room.name

    config = await _load_session_config(room_name)
    if config is None:
        # 通知前端載入失敗（沿用 legacy 的 pipeline_error 格式）
        try:
            await ctx.room.local_participant.publish_data(
                json.dumps({
                    "type": "pipeline_error",
                    "code": "session_load_failed",
                    "message": "無法載入對話設定，請返回重新選擇",
                }).encode("utf-8"),
                reliable=True,
            )
            await asyncio.sleep(0.5)  # 給 LiveKit 時間傳遞訊息
        except Exception as e:
            print(f"[Pipeline] ⚠️ 無法傳送錯誤訊號: {e}", flush=True)
        return

    agent = StudentAgent(
        instructions=config["system_prompt"],
        room=ctx.room,
        db_session_id=config["db_session_id"],
        scenario_description=config["scenario_description"],
        personality_type=config["personality_type"],
        domain_weights=config["domain_weights"],
        initial_emotions=config["initial_emotions"],
    )

    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            model=REALTIME_MODEL,
            voice=config["personality_voice"],
            input_audio_transcription=AudioTranscription(model="whisper-1"),
        ),
    )

    # 老師語音轉文字（定稿）→ user_transcription + 落 DB
    @session.on("user_input_transcribed")
    def _on_user_transcribed(ev: UserInputTranscribedEvent):
        if not ev.is_final or not ev.transcript.strip():
            return

        async def _handle():
            await _write_transcript(agent.db_session_id, "teacher", ev.transcript, "realtime")
            await agent.publish({"type": "user_transcription", "text": ev.transcript})

        asyncio.create_task(_handle())

    # 學生本輪定稿 → agent_response + 落 DB
    @session.on("conversation_item_added")
    def _on_item_added(ev: ConversationItemAddedEvent):
        item = ev.item
        if getattr(item, "role", None) != "assistant":
            return
        text = (item.text_content or "").strip()
        if not text:
            return

        async def _handle():
            await _write_transcript(agent.db_session_id, "student", text, "realtime")
            await agent.publish({"type": "agent_response", "text": text})

        asyncio.create_task(_handle())

    await session.start(agent=agent, room=ctx.room)

    # 老師文字輸入（data channel）→ 落 DB + 觸發學生回應
    # 注意：前端送出時已在本地樂觀顯示老師訊息，故此處不再回送 user_transcription。
    @ctx.room.on("data_received")
    def _on_data_received(packet: rtc.DataPacket):
        try:
            msg = json.loads(bytes(packet.data).decode("utf-8"))
        except Exception:
            return
        if msg.get("type") != "teacher_text_input":
            return
        text = (msg.get("text") or "").strip()
        if not text:
            return

        async def _handle():
            await _write_transcript(agent.db_session_id, "teacher", text, "text")
            session.generate_reply(user_input=text)

        asyncio.create_task(_handle())

    # 阻塞 entrypoint 直到房間斷線，維持 job 存活
    disconnected: asyncio.Future = asyncio.Future()

    @ctx.room.on("disconnected")
    def _on_disconnected(*_args):
        if not disconnected.done():
            disconnected.set_result(None)

    await disconnected


async def request_fnc(ctx: JobRequest):
    print(f"[Worker] received job request, room={ctx.room.name if ctx.room else 'unknown'}", flush=True)
    await ctx.accept()
    print(f"[Worker] job accepted", flush=True)


AGENT_NAME = os.getenv("LIVEKIT_AGENT_NAME", "selfcorner-student")

if __name__ == "__main__":
    # RAM 已升級（Render Standard 2GB），可保留 idle 子進程預熱以加快首個 job。
    num_idle = int(os.getenv("WORKER_NUM_IDLE_PROCESSES", "1"))
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
