#!/usr/bin/env python3
"""
load_data.py
Read `data/argus_seed_data.csv` and insert 500 seed rows into Supabase
`ticket_outcomes` table ONLY.

Seed rows bootstrap Signal C from day one. They have:
- signal_a = NULL (no Qdrant embedding done yet — embed_tickets.py handles that)
- signal_b = NULL
- signal_c = NULL
- ticket_id = random UUID (not in tickets table — this is intentional)

The tickets table is NOT written to. It only contains live submissions from the pipeline.

Run after seed_systems.py and seed_users.py.
Then run embed_tickets.py to vectorize and upsert into Qdrant.
"""

import os
import sys
import csv
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from services.supabase import get_supabase

CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/argus_seed_data.csv")

REQUIRED_COLUMNS = {
    "ticket_id",
    "description",
    "category",
    "severity",
    "resolution",
    "resolution_cluster",
    "user_tier",
    "department",
    "auto_resolved",
    "verified",
    "created_at",
}


def main():
    supabase = get_supabase()

    inserted = 0
    skipped = 0
    errors = 0

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        if not REQUIRED_COLUMNS.issubset(set(reader.fieldnames or [])):
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            print(f"CSV is missing required columns: {missing}")
            sys.exit(1)

        for row in reader:
            csv_ticket_id = row["ticket_id"]

            outcome_row = {
                "ticket_id": str(uuid.uuid4()),
                "category": row["category"],
                "description": row["description"],
                "auto_resolved": row["auto_resolved"].lower() == "true",
                "sandbox_passed": True,
                "signal_a": None,
                "signal_b": None,
                "signal_c": None,
                "escalation_reason": None,
                "resolution": row["resolution"],
                "resolution_cluster": row["resolution_cluster"],
                "agent_verified": row["verified"].lower() == "true",
                "override_reason": None,
                "ai_suggestion": None,
                "retrospective_match": None,
                "created_at": row["created_at"],
            }

            try:
                supabase.table("ticket_outcomes").insert(outcome_row).execute()
                inserted += 1
                if inserted % 50 == 0:
                    print(f"  ... {inserted} seed rows inserted so far")
            except Exception as e:
                print(f"  [ERROR] Failed to insert {csv_ticket_id}: {e}")
                errors += 1

    print(
        f"\nDone. {inserted} seed rows inserted into ticket_outcomes, {errors} errors."
    )


if __name__ == "__main__":
    main()
