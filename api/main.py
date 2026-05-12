from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.models import GenerateRequest, GenerateResponse, PlatformDraft, ScoreAnnotation
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
        from agents.graph import get_compiled_graph
        graph = get_compiled_graph()

        initial_state = {
            "brief_text":                request.brief_text,
            "brief_url":                 request.brief_url,
            "workspace_id":              request.workspace_id or "00000000-0000-0000-0000-000000000001",
            "core_message":              None,
            "intent":                    None,
            "audience":                  None,
            "key_points":                None,
            "cta_intent":                None,
            "factual_claims":            None,
            "voice_profile":             None,
            "exemplars":                 None,
            "voice_context":             None,
            "platform_rules":            None,
            "drafts":                    None,
            "platforms_pending_revision": None,
            "_target_platform":          None,
            "run_complete":              None,
        }

        result = await graph.ainvoke(initial_state)

        raw_drafts = result.get("drafts") or []
        drafts = []
        for d in raw_drafts:
            annotations = [
                ScoreAnnotation(criterion=a.get("criterion", ""), note=a.get("note", ""))
                for a in (d.get("score_annotations") or [])
            ]
            drafts.append(PlatformDraft(
                platform=d["platform"],
                post_text=d["post_text"],
                revision_count=d.get("revision_count", 0),
                score_brief=d.get("score_brief"),
                score_platform=d.get("score_platform"),
                score_hook=d.get("score_hook"),
                score_factual=d.get("score_factual"),
                score_cta=d.get("score_cta"),
                score_voice=d.get("score_voice"),
                score_weighted=d.get("score_weighted"),
                score_annotations=annotations,
                passed=d.get("passed"),
            ))

        return GenerateResponse(
            drafts=drafts,
            run_complete=result.get("run_complete", False),
            workspace_id=request.workspace_id or "00000000-0000-0000-0000-000000000001",
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
