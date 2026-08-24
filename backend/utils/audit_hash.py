import hashlib
import json
from typing import Dict, Any

def generate_audit_hash(evidence_card: Dict[str, Any], previous_hash: str) -> str:
    """
    Generates a deterministic SHA-256 hash chaining the current evidence card
    to the previous audit hash, ensuring an immutable log sequence.
    """
    # Deterministic JSON serialization
    serialized_card = json.dumps(evidence_card, sort_keys=True)
    payload_string = f"{previous_hash}::{serialized_card}"
    
    return hashlib.sha256(payload_string.encode('utf-8')).hexdigest()

def log_to_audit(ticket_id: str, decision: str, evidence_card: Dict[str, Any], supabase_client, latency_ms: int = 0) -> str:
    """
    Fetches the previous hash, calculates the new hash, and inserts the
    audit log entry into Supabase. Returns the newly generated hash.
    """
    # Fetch the last log entry's hash
    previous_hash = supabase_client.get_last_audit_hash()
    
    # Calculate new hash
    new_hash = generate_audit_hash(evidence_card, previous_hash)
    
    # Insert new record
    log_data = {
        "ticket_id": ticket_id,
        "decision": decision,
        "evidence_card": evidence_card,
        "previous_hash": previous_hash,
        "audit_hash": new_hash,
        "latency_ms": latency_ms
    }
    supabase_client.insert_audit_log(log_data)
    
    return new_hash
