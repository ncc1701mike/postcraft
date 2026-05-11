from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.models import GenerateRequest, GenerateResponse
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Postcraft API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "postcraft-api"}

@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    try:
        from agents.graph import build_graph
        graph = build_graph()
        app_graph = graph.compile()
        initial_state = {
            "brief_text": request.brief_text,
            "brief_url": request.brief_url,
            "workspace_id": request.workspace_id or "00000000-0000-0000-0000-000000000001",
            "core_message": None,
            "intent": None,
            "audience": None,
            "voice_profile": None,
            "exemplars": None,
            "platform_rules": None,
            "drafts": None,
            "platforms_pending_revision": None,
            "run_complete": None,
        }
        result = app_graph.invoke(initial_state)
        return GenerateResponse(
            drafts=result.get("drafts", []),
            run_complete=result.get("run_complete", False),
            workspace_id=request.workspace_id or "00000000-0000-0000-0000-000000000001",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
