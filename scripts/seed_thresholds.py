#!/usr/bin/env python3
"""
seed_thresholds.py
Insert default confidence thresholds for all 8 ticket categories
into the `category_thresholds` table.
Run once after seed_users.py.
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from services.supabase import get_supabase

# All 8 categories with their default thresholds.
# Signal A = semantic similarity, B = cohort consensus, C = historical success rate.
THRESHOLDS = [
    {
        "category": "Auth/SSO",
        "threshold_a": 0.85,
        "threshold_b": 0.60,
        "threshold_c": 0.70,
        "novelty_threshold": 0.50,
        "min_sample_size": 30,
    },
    {
        "category": "SAP Issues",
        "threshold_a": 0.87,
        "threshold_b": 0.65,
        "threshold_c": 0.72,
        "novelty_threshold": 0.52,
        "min_sample_size": 30,
    },
    {
        "category": "Email Access",
        "threshold_a": 0.85,
        "threshold_b": 0.60,
        "threshold_c": 0.70,
        "novelty_threshold": 0.50,
        "min_sample_size": 30,
    },
    {
        "category": "VPN Problems",
        "threshold_a": 0.83,
        "threshold_b": 0.58,
        "threshold_c": 0.68,
        "novelty_threshold": 0.50,
        "min_sample_size": 30,
    },
    {
        "category": "Printer Issues",
        "threshold_a": 0.80,
        "threshold_b": 0.55,
        "threshold_c": 0.65,
        "novelty_threshold": 0.48,
        "min_sample_size": 25,
    },
    {
        "category": "Software Install",
        "threshold_a": 0.85,
        "threshold_b": 0.60,
        "threshold_c": 0.70,
        "novelty_threshold": 0.50,
        "min_sample_size": 30,
    },
    {
        "category": "Network/Connectivity",
        "threshold_a": 0.82,
        "threshold_b": 0.58,
        "threshold_c": 0.68,
        "novelty_threshold": 0.48,
        "min_sample_size": 30,
    },
    {
        "category": "Permissions/Access",
        "threshold_a": 0.86,
        "threshold_b": 0.62,
        "threshold_c": 0.72,
        "novelty_threshold": 0.52,
        "min_sample_size": 30,
    },
]

def main():
    supabase = get_supabase()
    inserted = 0
    skipped = 0
    for t in THRESHOLDS:
        existing = supabase.table("category_thresholds").select("id").eq("category", t["category"]).execute()
        if existing.data:
            print(f"  [SKIP] Thresholds for '{t['category']}' already exist.")
            skipped += 1
            continue
        supabase.table("category_thresholds").insert(t).execute()
        print(f"  [OK]   Inserted thresholds for: {t['category']}")
        inserted += 1

    print(f"\nDone. {inserted} inserted, {skipped} skipped.")

if __name__ == "__main__":
    main()
