#!/usr/bin/env python3
"""
seed_systems.py
Insert 8 mock IT systems into the Supabase `systems` table.
Run once before any ticket seeding.
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from services.supabase import get_supabase

SYSTEMS = [
    {"name": "SAP",               "category": "ERP",            "change_freeze": False, "active_incident": False},
    {"name": "VPN",               "category": "Network",        "change_freeze": False, "active_incident": False},
    {"name": "Email",             "category": "Communication",  "change_freeze": False, "active_incident": False},
    {"name": "Network",           "category": "Infrastructure", "change_freeze": False, "active_incident": False},
    {"name": "Printer",           "category": "Hardware",       "change_freeze": False, "active_incident": False},
    {"name": "Active Directory",  "category": "Auth/SSO",       "change_freeze": False, "active_incident": False},
    {"name": "Software Portal",   "category": "Software",       "change_freeze": False, "active_incident": False},
    {"name": "File Server",       "category": "Storage",        "change_freeze": False, "active_incident": False},
]

def main():
    supabase = get_supabase()
    inserted = 0
    skipped = 0
    for system in SYSTEMS:
        # Check for existing entry to avoid duplicates
        existing = supabase.table("systems").select("id").eq("name", system["name"]).execute()
        if existing.data:
            print(f"  [SKIP] {system['name']} already exists.")
            skipped += 1
            continue
        supabase.table("systems").insert(system).execute()
        print(f"  [OK]   Inserted system: {system['name']}")
        inserted += 1

    print(f"\nDone. {inserted} inserted, {skipped} skipped.")

if __name__ == "__main__":
    main()
