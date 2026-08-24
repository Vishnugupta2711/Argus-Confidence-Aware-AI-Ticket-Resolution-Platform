import json
import os
from typing import Dict

def load_cluster_map(path: str) -> Dict[str, str]:
    """Loads a JSON cluster map specifying {resolution_string: cluster_id}."""
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_resolution_cluster(resolution_text: str, cluster_map: Dict[str, str]) -> str:
    """
    Looks up the cluster ID for a resolution string.
    Normalizes the text first (lowercase, strip).
    Returns 'unknown_cluster' if not found.
    """
    if not resolution_text:
        return "unknown_cluster"
        
    normalized = resolution_text.lower().strip()
    return cluster_map.get(normalized, "unknown_cluster")
