# Postcraft

> From rough brief to platform-ready posts — crafted, evaluated, and revised by an agent pipeline.

**Live demo:** https://postcraft-eight.vercel.app
**API:** https://postcraft-production-0a23.up.railway.app/health
**Docs:** [What was used and why](docs/what-was-used-and-why.md)

---

## What it does

Postcraft takes a rough content brief — a few sentences, a URL, a product update, a win — and generates vetted, platform-native posts for LinkedIn, Twitter/X, and Instagram using a multi-agent LangGraph pipeline with a built-in eval and revision loop.

It is not a wrapper. The pipeline makes decisions: it analyzes intent, routes generation per platform, scores every output against a 6-criterion rubric, and rewrites anything that fails before returning results.

---

## The problem

Mid-market teams know what they want to say. They don't have time to say it well in three different formats for three different audiences. The brief-to-content gap is where most social strategies quietly die — not from lack of ideas, but from lack of execution bandwidth.

Postcraft closes that gap end to end.

---

## Architecture

```
Brief Input
↓
[1] Brief Analyst          — extracts core message, intent, audience, key points
↓
[2] Platform Router        — sets per-platform rules, merges voice profile overrides
↓
[3a] LinkedIn Generator  ─┐
[3b] Twitter Generator   ─┼─ parallel via LangGraph Send()
[3c] Instagram Generator ─┘
↓
[4] Eval Agent             — scores each draft against 6-criterion rubric
↓
[5] Revision Gate          — conditional edge: pass → format, fail → revise (max 1×)
↓
[6] Output Formatter       — sorts, saves to Supabase, returns to UI
```

### Eval rubric (6 criteria, weighted)

| Criterion | Weight | Notes |
|---|---|---|
| Brief faithfulness | 25% | Did it represent the brief accurately? |
| Platform nativity | 25% | Does it feel native to the platform? |
| Hook strength | 25% | Does the first line earn the scroll? |
| Factual accuracy | 10% | Are verifiable claims correct? (N/A eligible) |
| CTA clarity | 10% | Is there one clear next action? |
| Brand voice match | 5% | Does it sound like the client? |

Pass threshold: weighted score ≥ 3.5 AND no single criterion < 2.5. Anything below triggers a targeted revision — not a full restart.

---

## Stack

| Layer | Technology |
|---|---|
| Agent pipeline | LangGraph + Claude Sonnet (claude-sonnet-4-20250514) |
| Backend API | FastAPI + Uvicorn |
| Frontend | Next.js 14 + Tailwind CSS |
| Storage | Supabase (Postgres) |
| API deployment | Railway |
| Frontend deployment | Vercel |

---

## Why these choices

**LangGraph over a simple chain:** The revision loop requires conditional routing — a post that fails eval needs to go back to the generator, not restart the whole pipeline. LangGraph's `Send()` API enables targeted parallel re-generation per platform. A simple chain can't do this cleanly.

**Parallel generation:** All three platform generators run concurrently via `Send()`. On a typical brief this saves 6-8 seconds vs sequential.

**Reference-based eval:** The eval agent scores against gold standard exemplars stored in Supabase, not abstractions. This makes scoring explainable and improvable — better exemplars raise the quality bar automatically.

**Supabase for persistence:** Voice profiles, exemplars, and run history are all stored per workspace. This makes the system improvable over time — run history is future fine-tuning data.

---

## What I'd improve next

**v2 priorities:**
- User-uploadable exemplars — client pastes their 3 best posts, those become both the voice benchmark and quality reference simultaneously
- Image generation — DALL-E or Flux for LinkedIn/Instagram visuals, generated from the same brief
- LangSmith tracing — eval scores and revision decisions visible in LangSmith for pipeline debugging and improvement
- Workspace auth — Supabase Auth so multiple clients can have isolated voice profiles
- Streaming — stream post text to the UI token by token instead of waiting for the full pipeline

**Known limitations:**
- Instagram eval is strictest — the scene-led hook requirement causes the most revision triggers
- Fallback UI — if a URL fails to fetch, the brief text is used silently
- Single revision pass max — a second revision cycle would improve floor quality but adds latency

---

## Setup

```bash
# Clone
git clone https://github.com/ncc1701mike/postcraft.git
cd postcraft

# Python env
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Environment
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

# Database
# Run supabase/schema.sql in your Supabase SQL editor

# Run API
uvicorn api.main:app --reload

# Run frontend
cd frontend && npm install && npm run dev
```

---

## Project structure

```
postcraft/
├── api/
│   ├── main.py              # FastAPI app, /generate endpoint
│   └── models.py            # Pydantic request/response models
├── agents/
│   ├── graph.py             # LangGraph graph — all 6 nodes + edges
│   ├── prompts.py           # All agent prompts (brief analyst, generator, eval)
│   └── supabase_client.py   # Voice profile loading, run history
├── utils/
│   └── url_fetcher.py       # Async URL fetch + text extraction
└── frontend/
    └── src/
        ├── app/             # Next.js app router
        └── components/      # Header, BriefPanel, VoicePanel, ResultsPanel, ScoreCard
```

---

*Built in ~10 hours as a technical challenge. Demonstrates: LangGraph agentic pipelines, reference-based eval design, parallel agent orchestration, FastAPI + Next.js full stack, Supabase persistence.*
