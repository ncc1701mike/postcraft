# Postcraft

> From rough brief to platform-ready posts — crafted, evaluated, and revised by an agent pipeline.

## What it does
Postcraft takes a rough content brief and generates vetted, platform-native posts for LinkedIn, Twitter/X, and Instagram using a LangGraph agent pipeline with a built-in eval and revision loop.

## Stack
- **Agent pipeline**: LangGraph + Claude Sonnet (claude-sonnet-4-20250514)
- **Backend**: FastAPI + Uvicorn
- **Frontend**: Next.js 14 + Tailwind CSS
- **Storage**: Supabase (Postgres)
- **Deployment**: Vercel (frontend) + Railway or Fly.io (API)

## Pipeline
Brief → Brief Analyst → Platform Router → [LinkedIn | Twitter | Instagram] Generator (parallel) → Eval Agent → Revision Gate → Output Formatter

## Setup
1. Clone the repo
2. Copy .env.example to .env and fill in keys
3. pip install -r requirements.txt
4. Run the SQL in supabase/schema.sql against your Supabase project
5. cd frontend && npm install && npm run dev
6. uvicorn api.main:app --reload
