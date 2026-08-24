from services.qdrant import search_similar

async def retrieve_similar(vector: list[float], top_k: int = 5) -> list:
    """
    Layer 1b: Semantic Retrieval.
    Queries Qdrant for the closest resolved tickets in the vector space.
    Filters implicitly to 'verified=True' using the Qdrant service layer helper.
    Returns a list of Qdrant ScoredPoint objects.
    """
    # search_similar already filters for verified=True by default
    return await search_similar(vector=vector, top_k=top_k)
