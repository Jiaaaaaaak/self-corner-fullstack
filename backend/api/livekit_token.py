"""
API Layer - LiveKit Token Endpoints
"""
import os
from fastapi import APIRouter, Depends, HTTPException, Cookie
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from livekit import api as lk_api

from database import get_db
from services.db_manager import DBManager
from core.auth_module import generate_livekit_token, decode_access_token

router = APIRouter(prefix="/livekit", tags=["LiveKit"])

# 與 voice_pipeline.py 的 AGENT_NAME 保持一致；可用環境變數覆寫
LIVEKIT_AGENT_NAME = os.getenv("LIVEKIT_AGENT_NAME", "selfcorner-student")


class LiveKitTokenRequest(BaseModel):
    session_uuid: str


class LiveKitTokenResponse(BaseModel):
    token: str
    url: str
    room_name: str


async def get_current_user_id(
    access_token: Optional[str] = Cookie(default=None, alias="access_token"),
) -> int:
    if not access_token:
        raise HTTPException(status_code=401, detail="未登入")
    payload = decode_access_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token 無效")
    return int(payload["sub"])


async def _dispatch_agent_to_room(room_name: str):
    """明確 dispatch agent 到指定 room；livekit-agents 1.x 不依賴 anonymous worker auto-dispatch。"""
    livekit_url = os.getenv("LIVEKIT_URL", "")
    api_key = os.getenv("LIVEKIT_API_KEY", "")
    api_secret = os.getenv("LIVEKIT_API_SECRET", "")
    if not (livekit_url and api_key and api_secret):
        print("[LiveKit] dispatch 略過：LIVEKIT_URL/API_KEY/API_SECRET 其中一個未設定", flush=True)
        return

    client = lk_api.LiveKitAPI(url=livekit_url, api_key=api_key, api_secret=api_secret)
    try:
        await client.agent_dispatch.create_dispatch(
            lk_api.CreateAgentDispatchRequest(
                agent_name=LIVEKIT_AGENT_NAME,
                room=room_name,
            )
        )
        print(f"[LiveKit] agent dispatched: agent={LIVEKIT_AGENT_NAME} room={room_name}", flush=True)
    except Exception as e:
        # dispatch 失敗仍簽 token，避免使用者完全卡住；前端會看到 worker 沒進房。
        print(f"[LiveKit] agent dispatch failed: {e}", flush=True)
    finally:
        await client.aclose()


@router.post("/token", response_model=LiveKitTokenResponse)
async def get_livekit_token(
    body: LiveKitTokenRequest,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    db_manager = DBManager(db)
    session = await db_manager.get_session_by_uuid(body.session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session 不存在")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="無權操作此 Session")

    await _dispatch_agent_to_room(session.livekit_room_name)

    token = generate_livekit_token(
        room_name=session.livekit_room_name,
        participant_identity=f"teacher-{user_id}",
        participant_name="老師",
    )
    livekit_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")

    return LiveKitTokenResponse(
        token=token,
        url=livekit_url,
        room_name=session.livekit_room_name,
    )
