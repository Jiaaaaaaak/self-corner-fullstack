"""
API Layer - Auth Endpoints
處理登入、註冊、Token 刷新、登出、忘記密碼
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.db_manager import DBManager
from core.auth_module import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


# =============================================================================
# Pydantic Models
# =============================================================================

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class LoginRequest(BaseModel):
    account: str   # username 或 email
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    school: Optional[str] = None
    experience_years: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    school: Optional[str] = None
    experience_years: Optional[str] = None


# =============================================================================
# Helper：設定 Cookie
# =============================================================================

def _set_tokens_in_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=15 * 60,
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )


def _clear_cookies(response: Response):
    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE)


# =============================================================================
# Endpoints
# =============================================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    db_manager = DBManager(db)

    if await db_manager.get_user_by_email(body.email):
        raise HTTPException(status_code=400, detail="此電子信箱已被使用")
    if await db_manager.get_user_by_username(body.username):
        raise HTTPException(status_code=400, detail="此用戶名已被使用")

    user = await db_manager.create_user(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
    )
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        school=user.school,
        experience_years=user.experience_years,
    )


@router.post("/login")
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    db_manager = DBManager(db)

    # 支援 email 或 username 登入
    user = await db_manager.get_user_by_email(body.account)
    if not user:
        user = await db_manager.get_user_by_username(body.account)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str, expires_at = create_refresh_token()
    await db_manager.create_refresh_token(user.id, refresh_token_str, expires_at)

    _set_tokens_in_cookies(response, access_token, refresh_token_str)
    return {"message": "登入成功", "user_id": user.id, "username": user.username}


@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="缺少 Refresh Token")

    db_manager = DBManager(db)
    rt = await db_manager.get_refresh_token(refresh_token)

    if not rt or rt.is_revoked or rt.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh Token 無效或已過期")

    # Token Rotation：撤銷舊 token，發行新 token
    await db_manager.revoke_refresh_token(refresh_token)
    new_access = create_access_token({"sub": str(rt.user_id)})
    new_refresh, new_expires = create_refresh_token()
    await db_manager.create_refresh_token(rt.user_id, new_refresh, new_expires)

    _set_tokens_in_cookies(response, new_access, new_refresh)
    return {"message": "Token 已刷新"}


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        db_manager = DBManager(db)
        await db_manager.revoke_refresh_token(refresh_token)
    _clear_cookies(response)
    return {"message": "已登出"}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    # 本期不實作寄信，回傳成功訊息避免暴露帳號是否存在
    return {"message": "若此信箱已註冊，密碼重設信件已發送"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    access_token: Optional[str] = Cookie(default=None, alias=ACCESS_COOKIE),
    db: AsyncSession = Depends(get_db),
):
    if not access_token:
        raise HTTPException(status_code=401, detail="未登入")

    payload = decode_access_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token 無效或已過期")

    db_manager = DBManager(db)
    user = await db_manager.get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="用戶不存在")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        school=user.school,
        experience_years=user.experience_years,
    )


@router.put("/me", response_model=UserResponse)
async def update_me(
    body: UpdateProfileRequest,
    access_token: Optional[str] = Cookie(default=None, alias=ACCESS_COOKIE),
    db: AsyncSession = Depends(get_db),
):
    if not access_token:
        raise HTTPException(status_code=401, detail="未登入")

    payload = decode_access_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token 無效或已過期")

    db_manager = DBManager(db)
    user = await db_manager.update_user_profile(
        user_id=int(payload["sub"]),
        first_name=body.first_name,
        last_name=body.last_name,
        school=body.school,
        experience_years=body.experience_years,
    )
    if not user:
        raise HTTPException(status_code=404, detail="用戶不存在")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        school=user.school,
        experience_years=user.experience_years,
    )
