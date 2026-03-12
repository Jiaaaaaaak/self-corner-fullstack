"""
API Layer - Scenario Endpoints
提供情境列表（供前端驗證 scenario_id）
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
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
    short_desc: Optional[str] = None
    tags: list[str] = []
    practice_count: int = 0
    estimated_minutes: int = 10


@router.get("", response_model=List[ScenarioResponse])
async def get_scenarios(db: AsyncSession = Depends(get_db)):
    """取得所有啟用的情境列表"""
    db_manager = DBManager(db)
    scenarios = await db_manager.get_all_scenarios()
    stats = await db_manager.get_scenario_stats()
    return [
        ScenarioResponse(
            id=s.id,
            title=s.title,
            sel_category=s.sel_category,
            emoji=s.emoji,
            description=s.description,
            short_desc=s.short_desc if hasattr(s, "short_desc") else None,
            tags=s.tags if hasattr(s, "tags") and s.tags else [],
            practice_count=stats.get(s.id, {}).get("practice_count", 0),
            estimated_minutes=stats.get(s.id, {}).get("estimated_minutes", 10),
        )
        for s in scenarios
    ]
