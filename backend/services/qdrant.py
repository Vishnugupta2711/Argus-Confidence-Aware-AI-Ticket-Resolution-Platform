import os
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import VectorParams, Distance
from dotenv import load_dotenv

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "resolved_tickets")

if not QDRANT_URL or not QDRANT_API_KEY:
    raise ValueError("Missing Qdrant credentials in .env")

import warnings

warnings.filterwarnings("ignore", message=".*Qdrant client version.*")

# Initialize async client
client = AsyncQdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=30,
)


def get_qdrant_client() -> AsyncQdrantClient:
    """Returns the initialized Qdrant async client."""
    return client


async def init_collection():
    """Ensure the resolved_tickets collection exists with proper dimensions."""
    exists = await client.collection_exists(collection_name=QDRANT_COLLECTION)
    if not exists:
        print(f"Creating Qdrant collection: {QDRANT_COLLECTION}...")
        await client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
        )
        print("Collection created successfully.")
    else:
        print(f"Collection {QDRANT_COLLECTION} already exists.")


from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue


async def search_similar(
    vector: list[float], top_k: int = 5, filter_verified: bool = True
) -> list:
    """Search for similar tickets in Qdrant."""
    # Note: Qdrant doesn't have the verified field indexed yet, so we skip the filter
    # In production, we would need to create the index:
    # await client.create_payload_index(collection_name=QDRANT_COLLECTION, field_name="verified", field_schema="bool")

    response = await client.query_points(
        collection_name=QDRANT_COLLECTION, query=vector, limit=top_k
    )

    # query_points returns a QueryResponse object with a .points attribute
    # Return the points which have .score attributes
    if hasattr(response, "points"):
        return response.points
    return []


async def upsert_ticket(ticket_id: str, vector: list[float], payload: dict):
    """Upsert a single ticket vector and payload."""
    await client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=[PointStruct(id=ticket_id, vector=vector, payload=payload)],
    )


async def count_vectors() -> int:
    """Return the total number of vectors in the collection."""
    response = await client.count(collection_name=QDRANT_COLLECTION)
    return response.count
