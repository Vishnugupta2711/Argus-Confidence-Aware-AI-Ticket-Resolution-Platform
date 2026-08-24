import pytest
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from utils.audit_hash import generate_audit_hash, log_to_audit

class MockSupabase:
    def __init__(self):
        self.last_hash = "genesis_hash"
        self.inserted = []

    def get_last_audit_hash(self):
        return self.last_hash
        
    def insert_audit_log(self, data):
        self.inserted.append(data)
        self.last_hash = data["audit_hash"]

def test_deterministic_hashing():
    card1 = {"ticket_id": "123", "action": "reset"}
    card2 = {"action": "reset", "ticket_id": "123"} # Different order
    
    hash1 = generate_audit_hash(card1, "prev_xyz")
    hash2 = generate_audit_hash(card2, "prev_xyz")
    
    # Due to sort_keys=True, the hash must be identical
    assert hash1 == hash2

def test_chain_integrity():
    card = {"ticket_id": "123", "action": "reset"}
    
    hash1 = generate_audit_hash(card, "prev_1")
    hash2 = generate_audit_hash(card, "prev_2")
    
    # Different previous hashes MUST result in different final hashes
    assert hash1 != hash2

def test_genesis_hash(monkeypatch):
    client = MockSupabase()
    # Mocking Genesis hash return explicitly
    client.last_hash = "genesis_hash"
    
    card = {"test": True}
    expected_hash = generate_audit_hash(card, "genesis_hash")
    
    res_hash = log_to_audit("ticket_1", "PROCEED", card, client)
    
    assert res_hash == expected_hash
    assert client.inserted[0]["previous_hash"] == "genesis_hash"
    assert client.inserted[0]["audit_hash"] == expected_hash

def test_log_chaining():
    client = MockSupabase()
    
    h1 = log_to_audit("t1", "PROCEED", {"step": 1}, client)
    h2 = log_to_audit("t2", "ESCALATE", {"step": 2}, client)
    
    assert len(client.inserted) == 2
    assert client.inserted[1]["previous_hash"] == h1
    assert client.inserted[1]["audit_hash"] == h2
