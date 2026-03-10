"""
API Layer - Scenario Endpoints
提供情境列表（供前端驗證 scenario_id）
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.db_manager import DBManager

router = APIRouter(prefix="/scenarios", tags=["Scenario"])


class ScenarioResponse(BaseModel):
    id: int
    title: str
    sel_category: str
    emoji: str
    description: str


class PersonalityResponse(BaseModel):
    id: int
    name: str
    personality_type: str


@router.get("", response_model=List[ScenarioResponse])
async def get_scenarios(db: AsyncSession = Depends(get_db)):
    """取得所有啟用的情境列表"""
    db_manager = DBManager(db)
    scenarios = await db_manager.get_all_scenarios()
    return [
        ScenarioResponse(
            id=s.id,
            title=s.title,
            sel_category=s.sel_category,
            emoji=s.emoji,
            description=s.description,
        )
        for s in scenarios
    ]


@router.get("/personalities", response_model=List[PersonalityResponse])
async def get_personalities(db: AsyncSession = Depends(get_db)):
    """取得所有學生個性列表"""
    db_manager = DBManager(db)
    personalities = await db_manager.get_all_personalities()
    return [
        PersonalityResponse(
            id=p.id,
            name=p.name,
            personality_type=p.personality_type,
        )
        for p in personalities
    ]
