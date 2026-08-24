import os
import httpx
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()

JINA_API_KEY = os.getenv("JINA_API_KEY")
JINA_EMBEDDINGS_URL = "https://api.jina.ai/v1/embeddings"
MODEL_NAME = "jina-embeddings-v3"

if not JINA_API_KEY:
    raise ValueError("Missing JINA_API_KEY in .env")

async def generate_embeddings(texts: Union[str, List[str]], task: str = "text-matching") -> List[List[float]]:
    """
    Generates embeddings using Jina AI's v3 model.
    task can be: 'retrieval.query', 'retrieval.passage', 'text-matching', 'classification', 'separation'
    We use 'text-matching' as the default for semantic similarity comparing tickets.
    """
    if isinstance(texts, str):
        texts = [texts]
        
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}"
    }
    
    payload = {
        "model": MODEL_NAME,
        "task": task,
        "dimensions": 1024,
        "late_chunking": False,
        "embedding_type": "float",
        "input": texts
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(JINA_EMBEDDINGS_URL, headers=headers, json=payload, timeout=30.0)
        
        if response.status_code != 200:
            raise Exception(f"Jina API Error {response.status_code}: {response.text}")
            
        data = response.json()
        
        # Return list of embeddings maintaining order
        # data['data'] contains items with 'embedding' key
        sorted_results = sorted(data["data"], key=lambda x: x["index"])
        return [item["embedding"] for item in sorted_results]

async def generate_embedding(text: str, task: str = "text-matching") -> List[float]:
    """Convenience wrapper for a single string"""
    embeddings = await generate_embeddings([text], task)
    return embeddings[0]

async def batch_embed(texts: List[str], task: str = "text-matching") -> List[List[float]]:
    """Convenience wrapper for batch embedding (handles optional batch chunking logic later if needed)"""
    return await generate_embeddings(texts, task)
