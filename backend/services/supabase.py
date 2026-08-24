import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

# Using the service_role key to bypass RLS for the backend service
_supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class SupabaseWrapper:
    """Wrapper around Supabase client with convenient methods for the pipeline"""
    
    def __init__(self, client: Client):
        self._client = client
    
    def get_user_by_email(self, email: str):
        response = self._client.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    
    def get_system_by_name(self, name: str):
        response = self._client.table("systems").select("*").eq("name", name).execute()
        return response.data[0] if response.data else None
    
    def get_system_by_id(self, system_id: str):
        response = self._client.table("systems").select("*").eq("id", system_id).execute()
        return response.data[0] if response.data else None
    
    def insert_ticket(self, ticket_data: dict) -> str:
        response = self._client.table("tickets").insert(ticket_data).execute()
        return response.data[0]["id"]
    
    def update_ticket(self, ticket_id: str, updates: dict):
        self._client.table("tickets").update(updates).eq("id", ticket_id).execute()
    
    def add_ticket_comment(self, ticket_id: str, comment: str, is_bot: bool):
        pass
    
    def insert_ticket_outcome(self, outcome_data: dict):
        self._client.table("ticket_outcomes").insert(outcome_data).execute()
    
    def get_category_thresholds(self, category: str) -> dict:
        response = self._client.table("category_thresholds").select("*").eq("category", category).execute()
        return response.data[0] if response.data else None
    
    def get_ticket_history(self, category: str, days: int = 30) -> list:
        from datetime import datetime, timedelta
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        response = self._client.table("ticket_outcomes").select("*").eq("category", category).gte("created_at", cutoff).execute()
        return response.data
    
    def insert_audit_log(self, entry_data: dict):
        response = self._client.table("audit_log").insert(entry_data).execute()
        return response.data[0]["id"]
    
    def get_last_audit_hash(self) -> str:
        response = self._client.table("audit_log").select("audit_hash").order("created_at", desc=True).limit(1).execute()
        return response.data[0]["audit_hash"] if response.data else "genesis_hash"
    
    def insert_novel_ticket(self, ticket_id: str, max_similarity: float):
        self._client.table("novel_tickets").insert({
            "ticket_id": ticket_id,
            "max_similarity": max_similarity,
            "reviewed": False
        }).execute()
    
    def table(self, name: str):
        """Direct access to Supabase table queries"""
        return self._client.table(name)


def get_supabase() -> SupabaseWrapper:
    """Returns a wrapped Supabase client with convenient methods."""
    return SupabaseWrapper(_supabase_client)

