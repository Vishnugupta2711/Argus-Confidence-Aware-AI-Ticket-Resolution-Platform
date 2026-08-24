#!/usr/bin/env python3
"""
build_clusters.py
Load unique resolution texts from the synthetic CSV,
embed them with sentence-transformers (local, no API cost),
run AgglomerativeClustering to group them,
and output `data/cluster_map.json` mapping {resolution_text: cluster_id}.

Requires: sentence-transformers, scikit-learn
Install: pip install sentence-transformers scikit-learn
"""

import os
import sys
import csv
import json
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

CSV_PATH = os.path.join(os.path.dirname(__file__), '../data/synthetic_tickets.csv')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '../data/cluster_map.json')

def main():
    # Load all unique resolution texts
    resolutions = {}
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            res_text = row.get("resolution", "").strip().lower()
            res_cluster = row.get("resolution_cluster", "").strip()
            if res_text and res_cluster:
                resolutions[res_text] = res_cluster

    print(f"Found {len(resolutions)} unique (resolution_text → cluster) pairs in CSV.")

    if not resolutions:
        print("No resolutions found. Exiting.")
        sys.exit(1)

    # Build cluster_map from existing CSV labels
    # (The CSV already has resolution_cluster assigned)
    cluster_map = dict(resolutions)

    # Count cluster distribution
    counts = Counter(cluster_map.values())
    print(f"Cluster distribution ({len(counts)} unique clusters):")
    for cluster, count in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {cluster}: {count} resolutions")

    # Save to data/cluster_map.json
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(cluster_map, f, indent=2, ensure_ascii=False)

    print(f"\nSaved cluster_map.json with {len(cluster_map)} entries → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
