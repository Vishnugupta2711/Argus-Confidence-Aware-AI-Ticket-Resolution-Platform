import asyncio
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct
import os
from dotenv import load_dotenv

load_dotenv(".env")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

async def main():
    client = AsyncQdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    try:
        await client.upsert(
            collection_name="resolved_tickets",
            points=[PointStruct(id="123e4567-e89b-12d3-a456-426614174000", vector=[0.1]*1024, payload={})]
        )
        print("Upsert UUID SUCCESS")
        await client.upsert(
            collection_name="resolved_tickets",
            points=[PointStruct(id="INC-10000", vector=[0.1]*1024, payload={})]
        )
        print("Upsert string SUCCESS")
    except Exception as e:
        print(f"Upsert Error: {e}")

asyncio.run(main())
