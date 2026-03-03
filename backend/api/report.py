"""
API Layer - Report Endpoints
取得回饋報告，以及 Feedback 頁面的教練文字對話
"""
import os
from fastapi import APIRouter, Depends, HTTPException, Cookie
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI

from database import get_db
from services.db_manager import DBManager
from core.auth_module import decode_access_token
from agents.prompts import COACH_CHAT_SYSTEM_PROMPT

router = APIRouter(prefix="/report", tags=["Report"])

coach_llm = ChatOpenAI(
    model=os.getenv("COACH_MODEL", "gpt-4o"),
    temperature=0.3,
)


async def get_current_user_id(
    access_token: Optional[str] = Cookie(default=None, alias="access_token"),
) -> int:
    if not access_token:
        raise HTTPException(status_code=401, detail="未登入")
    payload = decode_access_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token 無效")
    return int(payload["sub"])


# =============================================================================
# Pydantic Models
# =============================================================================

class TranscriptEntry(BaseModel):
    speaker: str
    text: str
    timestamp: str


class FeedbackReportResponse(BaseModel):
    session_uuid: str
    scenario_title: Optional[str]
    sel_scores: dict
    feedback_text: str
    analysis_text: str
    selected_kist_cards: list
    transcript: List[TranscriptEntry]
    generated_at: Optional[str]


class ChatMessage(BaseModel):
    role: str
    content: str


class CoachChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class CoachChatResponse(BaseModel):
    reply: str


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/{session_uuid}/feedback", response_model=FeedbackReportResponse)
async def get_feedback(
    session_uuid: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    db_manager = DBManager(db)
    session = await db_manager.get_session_by_uuid(session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session 不存在")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="無權查看此 Session")

    report = await db_manager.get_feedback_report_by_session(session.id)
    if not report:
        raise HTTPException(status_code=404, detail="回饋報告尚未生成")

    transcripts = await db_manager.get_session_transcripts(session.id)

    scenario_title = None
    if session.scenario_id:
        scenario = await db_manager.get_scenario_by_id(session.scenario_id)
        scenario_title = scenario.title if scenario else None

    return FeedbackReportResponse(
        session_uuid=session_uuid,
        scenario_title=scenario_title,
        sel_scores=report.sel_scores,
        feedback_text=report.feedback_text,
        analysis_text=report.analysis_text,
        selected_kist_cards=report.selected_kist_cards,
        transcript=[
            TranscriptEntry(
                speaker=t.speaker,
                text=t.text,
                timestamp=t.timestamp.isoformat() if t.timestamp else "",
            )
            for t in transcripts
        ],
        generated_at=report.generated_at.isoformat() if report.generated_at else None,
    )


@router.post("/{session_uuid}/chat", response_model=CoachChatResponse)
async def coach_chat(
    session_uuid: str,
    body: CoachChatRequest,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Feedback 頁面的教練文字對話。
    每次請求都包含完整的 transcript + feedback 作為系統 Context，
    以及前端維護的聊天歷史（history）。
    """
    db_manager = DBManager(db)
    session = await db_manager.get_session_by_uuid(session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session 不存在")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="無權操作此 Session")

    report = await db_manager.get_feedback_report_by_session(session.id)
    if not report:
        raise HTTPException(status_code=404, detail="回饋報告尚未生成，無法開始討論")

    transcripts = await db_manager.get_session_transcripts(session.id)

    # 組裝逐字稿字串
    transcript_str = "\n".join(
        f"{'老師' if t.speaker == 'teacher' else '學生'}：{t.text}"
        for t in transcripts
    )

    # 組裝 SEL 分數字串
    sel_scores_str = "\n".join(
        f"- {k}：{v}/10" for k, v in report.sel_scores.items()
    )

    # 組裝系統提示
    system_prompt = COACH_CHAT_SYSTEM_PROMPT.format(
        transcript=transcript_str,
        sel_scores=sel_scores_str,
        analysis=report.analysis_text,
        feedback=report.feedback_text,
        kist_cards="、".join(report.selected_kist_cards),
    )

    # 組裝訊息列表
    messages = [{"role": "system", "content": system_prompt}]
    for h in body.history:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": body.message})

    try:
        response = await coach_llm.ainvoke(messages)
        return CoachChatResponse(reply=response.content)
    except Exception as e:
        print(f"[Coach Chat Error] {e}")
        raise HTTPException(status_code=500, detail="教練回應生成失敗")
