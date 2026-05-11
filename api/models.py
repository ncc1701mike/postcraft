from pydantic import BaseModel
from typing import Optional

class GenerateRequest(BaseModel):
    brief_text: str
    brief_url: Optional[str] = None
    workspace_id: Optional[str] = None

class ScoreAnnotation(BaseModel):
    criterion: str
    note: str

class PlatformDraft(BaseModel):
    platform: str
    post_text: str
    revision_count: int
    score_brief: Optional[float] = None
    score_platform: Optional[float] = None
    score_hook: Optional[float] = None
    score_factual: Optional[float] = None
    score_cta: Optional[float] = None
    score_voice: Optional[float] = None
    score_weighted: Optional[float] = None
    score_annotations: list[ScoreAnnotation] = []
    passed: Optional[bool] = None

class GenerateResponse(BaseModel):
    drafts: list[PlatformDraft]
    run_complete: bool
    workspace_id: str
