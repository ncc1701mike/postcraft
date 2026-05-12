from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    return create_client(url, key)

def load_voice_profile(workspace_id: str) -> dict:
    try:
        sb = get_supabase()
        result = sb.table("voice_profiles") \
            .select("*") \
            .eq("workspace_id", workspace_id) \
            .eq("is_active", True) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        print(f"  load_voice_profile skipped (Supabase not configured): {e.__class__.__name__}")
        return {}

def load_exemplars(workspace_id: str) -> list:
    try:
        sb = get_supabase()
        result = sb.table("exemplars") \
            .select("*") \
            .eq("is_active", True) \
            .or_(f"is_gold_standard.eq.true,workspace_id.eq.{workspace_id}") \
            .execute()
        return result.data or []
    except Exception as e:
        print(f"  load_exemplars skipped (Supabase not configured): {e.__class__.__name__}")
        return []

def save_run(run_data: dict) -> dict:
    try:
        sb = get_supabase()
        result = sb.table("run_history").insert(run_data).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        print(f"  save_run skipped (Supabase not configured): {e.__class__.__name__}")
        return {}
