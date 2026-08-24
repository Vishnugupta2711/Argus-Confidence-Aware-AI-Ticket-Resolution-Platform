import os
import sys
import csv
import json
import asyncio
import uuid
from typing import List, Dict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

from backend.services.qdrant import get_qdrant_client
from backend.services.jina import batch_embed
from qdrant_client.models import VectorParams, Distance, PointStruct

CSV_PATH = os.path.join(os.path.dirname(__file__), '../data/argus_seed_data_final.csv')
COLLECTION_NAME = "resolved_tickets"

async def main():
    q_client = get_qdrant_client()

    print(f"Deleting collection: {COLLECTION_NAME}...")
    await q_client.delete_collection(collection_name=COLLECTION_NAME)

    print(f"Creating collection: {COLLECTION_NAME}...")
    await q_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
    )
    print("Collection recreated successfully.")

    outcomes = []
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["verified"].lower() == "true": # Only load verified rows
                outcomes.append(row)

    print(f"Read {len(outcomes)} verified rows from CSV for Qdrant seeding.")

    step = 50
    for i in range(0, len(outcomes), step):
        batch = outcomes[i:i+step]
        texts = [row["description"] for row in batch]
        
        # embed
        embeddings = await batch_embed(texts)

        points = []
        for row, embedding in zip(batch, embeddings):
            # ticket_id in CSV is like INC-10000. Qdrant requires int or UUID
            # the user asked to "Use the ticket_id value from the CSV as the point ID in Qdrant."
            try:
                # INC-10000 -> 10000
                point_id = int(row["ticket_id"].replace("INC-", "").strip())
            except Exception:
                # Fallback to a seeded UUID
                point_id = str(uuid.uuid5(uuid.NAMESPACE_OID, row["ticket_id"]))
                
            payload = {
                "ticket_id": row["ticket_id"],
                "description": row["description"],
                "category": row["category"],
                "severity": row["severity"],
                "resolution": row["resolution"],
                "resolution_cluster": row["resolution_cluster"],
                "user_tier": row["user_tier"],
                "verified": True
            }
            points.append(PointStruct(id=point_id, vector=embedding, payload=payload))

        await q_client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        print(f"Inserted {i + len(batch)} / {len(outcomes)}")

    print("Qdrant reload complete.")

if __name__ == "__main__":
    asyncio.run(main())
