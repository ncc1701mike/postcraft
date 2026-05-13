# ============================================================
# Postcraft — LangGraph Graph (Full Implementation)
# agents/graph.py
# ============================================================

from __future__ import annotations

import json
import os
from typing import Annotated, Optional
from typing_extensions import TypedDict

from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, END
from langgraph.constants import Send

from agents.prompts import (
    build_voice_context,
    BRIEF_ANALYST_SYSTEM,
    brief_analyst_user,
    GENERATOR_SYSTEM,
    generator_user,
    EVAL_SYSTEM,
    eval_user,
)
from agents.supabase_client import load_voice_profile, load_exemplars, save_run
from agents.humanizer import humanize_post
from utils.url_fetcher import fetch_url_text

load_dotenv()

MODEL = "claude-sonnet-4-20250514"


# ============================================================
# LLM FACTORY
# ============================================================

def get_llm(temperature: float = 0.7) -> ChatAnthropic:
    return ChatAnthropic(
        model=MODEL,
        temperature=temperature,
        anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )


# ============================================================
# DRAFT REDUCER
# Merges draft lists by platform — later value wins.
# Required so parallel generate_platform branches can each
# write their own draft without LangGraph seeing a conflict.
# ============================================================

def merge_drafts(left: Optional[list], right: Optional[list]) -> list:
    left = left or []
    right = right or []
    merged = {d["platform"]: d for d in left}
    for d in right:
        merged[d["platform"]] = d
    return list(merged.values())


# ============================================================
# STATE
# ============================================================

class PlatformDraft(TypedDict):
    platform:            str
    post_text:           str
    revision_count:      int
    score_brief:         Optional[float]
    score_platform:      Optional[float]
    score_hook:          Optional[float]
    score_factual:       Optional[float]
    score_cta:           Optional[float]
    score_voice:         Optional[float]
    score_weighted:      Optional[float]
    score_annotations:   list[dict]
    passed:              Optional[bool]
    revision_guidance:   Optional[str]


class PostcraftState(TypedDict):
    # Inputs
    brief_text:                  str
    brief_url:                   Optional[str]
    workspace_id:                str
    # Populated by brief analyst
    core_message:                Optional[str]
    intent:                      Optional[str]
    audience:                    Optional[str]
    key_points:                  Optional[list]
    cta_intent:                  Optional[str]
    factual_claims:              Optional[list]
    voice_profile:               Optional[dict]
    exemplars:                   Optional[list]
    voice_context:               Optional[str]
    # Populated by router
    platform_rules:              Optional[dict]
    # Drafts — Annotated reducer lets parallel branches each write one draft
    drafts:                      Annotated[Optional[list], merge_drafts]
    # Control
    platforms_pending_revision:  Optional[list]
    _target_platform:            Optional[str]
    run_complete:                Optional[bool]


# ============================================================
# NODE 1 — Brief Analyst
# ============================================================

async def brief_analyst(state: PostcraftState) -> PostcraftState:
    print("[1] brief_analyst")

    # Fetch URL if provided
    fetched_text = None
    if state.get("brief_url"):
        try:
            fetched_text = await fetch_url_text(state["brief_url"])
        except Exception as e:
            print(f"  URL fetch failed: {e}")

    # Call LLM
    llm = get_llm(temperature=0.0)
    messages = [
        {"role": "system", "content": BRIEF_ANALYST_SYSTEM},
        {"role": "user",   "content": brief_analyst_user(state["brief_text"], fetched_text)},
    ]
    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    # Parse JSON
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Attempt to extract JSON if model wrapped it
        import re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        parsed = json.loads(match.group()) if match else {}

    # Load Supabase context
    workspace_id = state.get("workspace_id", "00000000-0000-0000-0000-000000000001")
    voice_profile = load_voice_profile(workspace_id)
    exemplars     = load_exemplars(workspace_id)
    voice_ctx     = build_voice_context(voice_profile, exemplars)

    return {
        **state,
        "core_message":   parsed.get("core_message", state["brief_text"][:100]),
        "intent":         parsed.get("intent", "educate"),
        "audience":       parsed.get("audience", "general professional audience"),
        "key_points":     parsed.get("key_points", []),
        "cta_intent":     parsed.get("cta_intent", "engage with this post"),
        "factual_claims": parsed.get("factual_claims", []),
        "voice_profile":  voice_profile,
        "exemplars":      exemplars,
        "voice_context":  voice_ctx,
    }


# ============================================================
# NODE 2 — Platform Router
# ============================================================

def platform_router(state: PostcraftState) -> PostcraftState:
    print("[2] platform_router")

    intent = state.get("intent", "educate")
    vp     = state.get("voice_profile") or {}

    # Base rules per platform
    platform_rules = {
        "linkedin": {
            "max_chars":     3000,
            "hashtag_count": "3-5",
            "format_notes":  "Line breaks every 1-2 sentences. End with a question.",
            "hook_guidance":  "First line must be a standalone scroll-stopper.",
        },
        "twitter": {
            "max_chars":     280,
            "hashtag_count": "0 for opinion posts, 1-2 for announcements",
            "format_notes":  "Arrow lists OK. Single post preferred over threads.",
            "hook_guidance":  "First line IS the whole hook. Make it land alone.",
        },
        "instagram": {
            "max_chars":     2200,
            "hashtag_count": "0 in caption body (post in first comment)",
            "format_notes":  "Short paragraphs. Mobile-first. End with 'Link in bio.'",
            "hook_guidance":  "Open with a scene or moment, not a claim.",
        },
    }

    # Merge voice profile platform_notes overrides
    vp_notes = vp.get("platform_notes", {})
    if isinstance(vp_notes, str):
        try:
            vp_notes = json.loads(vp_notes)
        except Exception:
            vp_notes = {}

    for platform, note in vp_notes.items():
        if platform in platform_rules:
            platform_rules[platform]["voice_override"] = note

    # Intent-based adjustments
    if intent == "announce":
        platform_rules["twitter"]["hashtag_count"] = "1-2"
    if intent == "story":
        platform_rules["linkedin"]["hook_guidance"] = "Open with a specific moment or scene that creates tension."
        platform_rules["instagram"]["hook_guidance"] = "Drop the reader into the exact moment — sensory detail welcome."

    return {**state, "platform_rules": platform_rules}


# ============================================================
# NODE 3 — Platform Generator
# ============================================================

async def generate_platform(state: PostcraftState) -> PostcraftState:
    platform = state.get("_target_platform", "linkedin")
    print(f"[3] generate_platform ({platform})")

    # Check if this is a revision run
    existing_drafts = state.get("drafts") or []
    existing = next((d for d in existing_drafts if d["platform"] == platform), None)
    is_revision       = existing is not None and existing.get("revision_count", 0) > 0
    previous_post     = existing.get("post_text")        if existing else None
    revision_feedback = existing.get("revision_guidance") if existing else None

    # Get temperature from voice profile (default 0.7)
    vp   = state.get("voice_profile") or {}
    temp = float(vp.get("model_temp", 0.7))

    llm = get_llm(temperature=temp)
    prompt = generator_user(
        platform=platform,
        core_message=state.get("core_message", ""),
        intent=state.get("intent", "educate"),
        audience=state.get("audience", ""),
        key_points=state.get("key_points") or [],
        cta_intent=state.get("cta_intent", ""),
        platform_rules=state.get("platform_rules") or {},
        voice_context=state.get("voice_context", ""),
        is_revision=is_revision,
        previous_post=previous_post,
        revision_feedback=revision_feedback,
    )

    messages = [
        {"role": "system", "content": GENERATOR_SYSTEM},
        {"role": "user",   "content": prompt},
    ]
    response = await llm.ainvoke(messages)
    post_text = response.content.strip()

    draft: dict = {
        "platform":          platform,
        "post_text":         post_text,
        "revision_count":    (existing.get("revision_count", 0) if existing else 0),
        "score_brief":       None,
        "score_platform":    None,
        "score_hook":        None,
        "score_factual":     None,
        "score_cta":         None,
        "score_voice":       None,
        "score_weighted":    None,
        "score_annotations": [],
        "passed":            None,
        "revision_guidance": None,
    }

    # Return only the key we're changing — the merge_drafts reducer handles fan-out merging
    return {"drafts": [draft]}


# ============================================================
# NODE 4 — Eval Agent
# ============================================================

async def eval_agent(state: PostcraftState) -> PostcraftState:
    print("[4] eval_agent — parallel")
    import asyncio

    llm = get_llm(temperature=0.0)

    async def score_single(draft):
        platform  = draft["platform"]
        post_text = draft["post_text"]

        prompt = eval_user(
            platform=platform,
            post_text=post_text,
            core_message=state.get("core_message", ""),
            intent=state.get("intent", ""),
            cta_intent=state.get("cta_intent", ""),
            voice_context=state.get("voice_context", ""),
        )

        messages = [
            {"role": "system", "content": EVAL_SYSTEM},
            {"role": "user",   "content": prompt},
        ]
        response = await llm.ainvoke(messages)
        raw = response.content.strip()

        try:
            scores = json.loads(raw)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            scores = json.loads(match.group()) if match else {}

        return {
            **draft,
            "score_brief":       scores.get("score_brief"),
            "score_platform":    scores.get("score_platform"),
            "score_hook":        scores.get("score_hook"),
            "score_factual":     scores.get("score_factual"),
            "score_cta":         scores.get("score_cta"),
            "score_voice":       scores.get("score_voice"),
            "score_weighted":    scores.get("score_weighted"),
            "score_annotations": scores.get("annotations", []),
            "passed":            scores.get("passed", False),
            "revision_guidance": scores.get("revision_guidance", ""),
        }

    scored_drafts = await asyncio.gather(*[score_single(d) for d in (state.get("drafts") or [])])
    return {**state, "drafts": list(scored_drafts)}


# ============================================================
# NODE 4b — Humanizer
# ============================================================

async def humanizer_node(state: PostcraftState) -> PostcraftState:
    print("[4b] humanizer_node — parallel")
    import asyncio

    core_message = state.get("core_message", "")
    vp   = state.get("voice_profile") or {}
    temp = float(vp.get("model_temp", 0.85))

    async def humanize_single(draft):
        humanized_text = await humanize_post(
            platform=draft["platform"],
            post_text=draft["post_text"],
            core_message=core_message,
            temperature=temp,
        )
        return {**draft, "post_text": humanized_text}

    humanized_drafts = await asyncio.gather(*[humanize_single(d) for d in (state.get("drafts") or [])])
    return {**state, "drafts": list(humanized_drafts)}


# ============================================================
# NODE 5 — Revision Gate
# ============================================================

def revision_gate(state: PostcraftState) -> PostcraftState:
    print("[5] revision_gate")

    pending = []
    for draft in (state.get("drafts") or []):
        max_revisions = 2 if draft.get("platform") == "instagram" else 1
        already_revised = draft.get("revision_count", 0) >= max_revisions
        if not draft.get("passed") and not already_revised:
            pending.append(draft["platform"])
            print(f"  {draft['platform']} failed (score: {draft.get('score_weighted')}) — queuing revision")

    return {**state, "platforms_pending_revision": pending}


def should_revise(state: PostcraftState) -> str:
    pending = state.get("platforms_pending_revision") or []
    return "revise" if pending else "format"


# ============================================================
# NODE 5b — Revision Dispatcher
# ============================================================

def revision_dispatcher(state: PostcraftState) -> PostcraftState:
    """Node: bumps revision_count on all platforms queued for revision."""
    pending = state.get("platforms_pending_revision") or []
    print(f"[5b] revision_dispatcher — platforms: {pending}")

    updated_drafts = []
    for draft in (state.get("drafts") or []):
        if draft["platform"] in pending:
            updated_drafts.append({
                **draft,
                "revision_count": draft.get("revision_count", 0) + 1,
            })
        else:
            updated_drafts.append(draft)

    return {**state, "drafts": updated_drafts}


def dispatch_revisions(state: PostcraftState) -> list:
    """Conditional edge function: fans out to generate_platform for each pending platform."""
    pending = state.get("platforms_pending_revision") or []
    return [Send("generate_platform", {**state, "_target_platform": p}) for p in pending]


# ============================================================
# NODE 6 — Output Formatter
# ============================================================

async def output_formatter(state: PostcraftState) -> PostcraftState:
    print("[6] output_formatter")

    platform_order = ["linkedin", "twitter", "instagram"]
    drafts = state.get("drafts") or []
    sorted_drafts = sorted(
        drafts,
        key=lambda d: platform_order.index(d["platform"]) if d["platform"] in platform_order else 99
    )

    # Save to Supabase run_history
    try:
        save_run({
            "workspace_id":     state.get("workspace_id"),
            "voice_profile_id": (state.get("voice_profile") or {}).get("id"),
            "brief_text":       state.get("brief_text"),
            "brief_url":        state.get("brief_url"),
            "outputs":          json.dumps(sorted_drafts),
            "model_used":       MODEL,
            "revision_count":   sum(d.get("revision_count", 0) for d in sorted_drafts),
            "status":           "completed",
        })
    except Exception as e:
        print(f"  Supabase save failed (non-fatal): {e}")

    return {**state, "drafts": sorted_drafts, "run_complete": True}


# ============================================================
# GRAPH ASSEMBLY
# ============================================================

def build_graph() -> StateGraph:
    g = StateGraph(PostcraftState)

    g.add_node("analyze_brief",     brief_analyst)
    g.add_node("route_platforms",   platform_router)
    g.add_node("generate_platform", generate_platform)
    g.add_node("evaluate",          eval_agent)
    g.add_node("gate",              revision_gate)
    g.add_node("revise",            revision_dispatcher)
    g.add_node("humanize",          humanizer_node)
    g.add_node("format_output",     output_formatter)

    g.set_entry_point("analyze_brief")

    g.add_edge("analyze_brief", "route_platforms")

    g.add_conditional_edges(
        "route_platforms",
        lambda state: [
            Send("generate_platform", {**state, "_target_platform": p})
            for p in ["linkedin", "twitter", "instagram"]
        ],
        ["generate_platform"],
    )

    g.add_edge("generate_platform", "evaluate")
    g.add_edge("evaluate",          "gate")

    g.add_conditional_edges(
        "gate",
        should_revise,
        {
            "revise": "revise",
            "format": "humanize",
        }
    )

    g.add_conditional_edges(
        "revise",
        dispatch_revisions,
        ["generate_platform"],
    )

    g.add_edge("humanize",      "format_output")
    g.add_edge("format_output", END)

    return g


# ============================================================
# COMPILE
# ============================================================

def get_compiled_graph():
    return build_graph().compile()
