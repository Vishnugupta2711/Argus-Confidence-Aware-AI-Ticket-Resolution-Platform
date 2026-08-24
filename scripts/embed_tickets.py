#!/usr/bin/env python3
"""
embed_tickets.py
Read all auto-resolved, agent-verified tickets from Supabase,
batch-embed their descriptions via Jina AI (with rate-limit delays),
and upsert all vectors + payloads into Qdrant `resolved_tickets` collection.
Run after load_data.py.
"""

import os
import sys
import asyncio
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from services.supabase import get_supabase
from services.jina import batch_embed
import services.qdrant as qdrant_svc

BATCH_SIZE = 20        # Jina API batch size
RATE_LIMIT_DELAY = 1.0 # seconds between batches


async def main():
    supabase = get_supabase()

    # Initialize Qdrant collection
    print("Verifying Qdrant collection...")
    await qdrant_svc.init_collection()

    # Fetch all verified, auto-resolved tickets with their outcomes
    print("Fetching verified tickets from Supabase...")
    tickets_res = supabase.table("tickets")\
        .select("id, description, category, severity")\
        .in_("status", ["auto_resolved", "resolved"])\
        .execute()
    tickets = tickets_res.data
    print(f"Found {len(tickets)} tickets to embed.")

    if not tickets:
        print("No tickets to embed. Exiting.")
        return

    # Fetch outcomes to get resolution + cluster data
    ticket_ids = [t["id"] for t in tickets]
    outcomes_res = supabase.table("ticket_outcomes")\
        .select("ticket_id, resolution, resolution_cluster, agent_verified, auto_resolved")\
        .execute()
    outcome_by_id = {o["ticket_id"]: o for o in outcomes_res.data}

    # Batch-embed and upsert
    total_upserted = 0
    for i in range(0, len(tickets), BATCH_SIZE):
        batch = tickets[i: i + BATCH_SIZE]
        descriptions = [t["description"] for t in batch]

        print(f"  Embedding batch {i // BATCH_SIZE + 1} ({len(batch)} tickets)...")
        try:
            vectors = await batch_embed(descriptions)
        except Exception as e:
            print(f"  [ERROR] Embedding failed for batch starting at {i}: {e}")
            continue

        # Upsert each vector
        for ticket, vector in zip(batch, vectors):
            outcome = outcome_by_id.get(ticket["id"])
            if not outcome:
                continue
            payload = {
                "category": ticket["category"],
                "description": ticket["description"],
                "severity": ticket["severity"],
                "resolution": outcome.get("resolution", ""),
                "resolution_cluster": outcome.get("resolution_cluster", "unknown"),
                "auto_resolved": outcome.get("auto_resolved", False),
                "verified": outcome.get("agent_verified", False),
            }
            try:
                await qdrant_svc.upsert_ticket(ticket["id"], vector, payload)
                total_upserted += 1
            except Exception as e:
                print(f"  [ERROR] Upsert failed for ticket {ticket['id']}: {e}")

        print(f"  Upserted {total_upserted} vectors so far.")
        if i + BATCH_SIZE < len(tickets):
            time.sleep(RATE_LIMIT_DELAY)

    final_count = await qdrant_svc.count_vectors()
    print(f"\nDone. {total_upserted} upserted. Qdrant collection now has {final_count} total vectors.")


if __name__ == "__main__":
    asyncio.run(main())
