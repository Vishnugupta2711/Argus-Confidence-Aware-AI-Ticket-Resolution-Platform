#!/usr/bin/env python3
"""
prepare_demo.py
Insert the 5 specific demo tickets from SOLUTION.md Section 14 and their expected outcomes.
These are used during live hackathon demos to showcase all pipeline paths:
  1. Password Reset     → auto-resolved (happy path)
  2. SAP Login          → auto-resolved (different category)
  3. Intermittent Network → Signal B fail → escalated
  4. CEO Email          → VIP escalation by Policy Gate
  5. Production DB Down → P1 escalation by Policy Gate

Run after seed_users.py and seed_systems.py.
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from services.supabase import get_supabase

DEMO_TICKETS = [
    {
        "ticket": {
            "description": "Reset my password — locked out of Windows",
            "category": "Auth/SSO",
            "severity": "P3",
            "status": "auto_resolved",
            "user_email": "john.doe@argus.local",
        },
        "outcome": {
            "category": "Auth/SSO",
            "auto_resolved": True,
            "sandbox_passed": True,
            "signal_a": 0.91,
            "signal_b": 0.75,
            "signal_c": 0.80,
            "resolution": "Reset Active Directory password and unlocked account.",
            "agent_verified": True,
            "escalation_reason": None,
        },
        "label": "Demo 1 — Password Reset (auto-resolve)"
    },
    {
        "ticket": {
            "description": "SAP login not working since this morning",
            "category": "SAP Issues",
            "severity": "P3",
            "status": "auto_resolved",
            "user_email": "jane.smith@argus.local",
        },
        "outcome": {
            "category": "SAP Issues",
            "auto_resolved": True,
            "sandbox_passed": True,
            "signal_a": 0.88,
            "signal_b": 0.70,
            "signal_c": 0.74,
            "resolution": "Cleared SAP session cache and re-authenticated user.",
            "agent_verified": True,
            "escalation_reason": None,
        },
        "label": "Demo 2 — SAP Login (auto-resolve)"
    },
    {
        "ticket": {
            "description": "Intermittent network issue — sometimes works sometimes doesn't",
            "category": "Network/Connectivity",
            "severity": "P3",
            "status": "escalated",
            "user_email": "bob.jones@argus.local",
        },
        "outcome": {
            "category": "Network/Connectivity",
            "auto_resolved": False,
            "sandbox_passed": None,
            "signal_a": 0.84,
            "signal_b": 0.42,  # Signal B fails
            "signal_c": 0.71,
            "resolution": None,
            "agent_verified": False,
            "escalation_reason": "Signal B (cohort consensus) below threshold: 0.42 < 0.58",
        },
        "label": "Demo 3 — Intermittent Network (Signal B fail → escalated)"
    },
    {
        "ticket": {
            "description": "CEO cannot access his email — urgent",
            "category": "Email Access",
            "severity": "P3",
            "status": "escalated",
            "user_email": "ceo@argus.local",  # VIP user
        },
        "outcome": {
            "category": "Email Access",
            "auto_resolved": False,
            "sandbox_passed": None,
            "signal_a": None,
            "signal_b": None,
            "signal_c": None,
            "resolution": None,
            "agent_verified": False,
            "escalation_reason": "VIP tier user — immediate human escalation required.",
        },
        "label": "Demo 4 — CEO Email (VIP escalation by Policy Gate)"
    },
    {
        "ticket": {
            "description": "Production database is completely down — all services affected",
            "category": "Network/Connectivity",
            "severity": "P1",
            "status": "escalated",
            "user_email": "david.garcia@argus.local",
        },
        "outcome": {
            "category": "Network/Connectivity",
            "auto_resolved": False,
            "sandbox_passed": None,
            "signal_a": None,
            "signal_b": None,
            "signal_c": None,
            "resolution": None,
            "agent_verified": False,
            "escalation_reason": "High severity (P1) — immediate human escalation required.",
        },
        "label": "Demo 5 — Production DB Down (P1 escalation by Policy Gate)"
    },
]


def main():
    supabase = get_supabase()

    # Cache user IDs
    users_res = supabase.table("users").select("id, email").execute()
    user_cache = {u["email"]: u["id"] for u in users_res.data}

    for demo in DEMO_TICKETS:
        t = demo["ticket"]
        o = demo["outcome"]
        label = demo["label"]

        user_id = user_cache.get(t["user_email"])
        if not user_id:
            print(f"  [SKIP] User not found: {t['user_email']} — run seed_users.py first.")
            continue

        try:
            # Insert ticket
            ticket_row = {
                "user_id": user_id,
                "description": t["description"],
                "category": t["category"],
                "severity": t["severity"],
                "status": t["status"],
            }
            ticket_res = supabase.table("tickets").insert(ticket_row).execute()
            ticket_id = ticket_res.data[0]["id"]

            # Insert outcome
            outcome_row = {
                "ticket_id": ticket_id,
                **{k: v for k, v in o.items() if v is not None},
            }
            supabase.table("ticket_outcomes").insert(outcome_row).execute()

            print(f"  [OK] {label} → ticket_id: {ticket_id}")
        except Exception as e:
            print(f"  [ERROR] {label}: {e}")

    print("\nDemo tickets prepared.")


if __name__ == "__main__":
    main()
