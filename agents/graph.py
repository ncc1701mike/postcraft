from langgraph.graph import StateGraph
from typing import TypedDict, Optional, Any


class PostcraftState(TypedDict):
    brief_text: str
    brief_url: Optional[str]
    workspace_id: str
    core_message: Optional[str]
    intent: Optional[str]
    audience: Optional[str]
    voice_profile: Optional[dict]
    exemplars: Optional[list]
    platform_rules: Optional[dict]
    drafts: Optional[list]
    platforms_pending_revision: Optional[list]
    run_complete: Optional[bool]


def build_graph() -> StateGraph:
    graph = StateGraph(PostcraftState)
    return graph
