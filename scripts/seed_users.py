#!/usr/bin/env python3
"""
seed_users.py
Insert 15 mock users into the Supabase `users` table.
Includes 3 VIP users (CEO, CFO, CTO) and 12 standard users across departments.
Run once after seed_systems.py.
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from services.supabase import get_supabase

USERS = [
    # VIP users
    {"email": "ceo@argus.local",        "name": "Alice Pemberton",  "tier": "vip",      "department": "Executive"},
    {"email": "cfo@argus.local",        "name": "Bernard Harlow",   "tier": "vip",      "department": "Finance"},
    {"email": "cto@argus.local",        "name": "Clara Reeves",     "tier": "vip",      "department": "Technology"},

    # Standard users across departments
    {"email": "john.doe@argus.local",       "name": "John Doe",         "tier": "standard", "department": "Engineering"},
    {"email": "jane.smith@argus.local",     "name": "Jane Smith",       "tier": "standard", "department": "Engineering"},
    {"email": "bob.jones@argus.local",      "name": "Bob Jones",        "tier": "standard", "department": "Sales"},
    {"email": "sarah.lee@argus.local",      "name": "Sarah Lee",        "tier": "standard", "department": "Marketing"},
    {"email": "mike.chen@argus.local",      "name": "Mike Chen",        "tier": "standard", "department": "HR"},
    {"email": "priya.sharma@argus.local",   "name": "Priya Sharma",     "tier": "standard", "department": "Finance"},
    {"email": "tom.nguyen@argus.local",     "name": "Tom Nguyen",       "tier": "standard", "department": "Operations"},
    {"email": "anna.kowalski@argus.local",  "name": "Anna Kowalski",    "tier": "standard", "department": "Logistics"},
    {"email": "david.garcia@argus.local",   "name": "David Garcia",     "tier": "standard", "department": "Legal"},

    # Contractor users
    {"email": "contractor.1@argus.local",   "name": "Contractor One",   "tier": "contractor", "department": "External"},
    {"email": "contractor.2@argus.local",   "name": "Contractor Two",   "tier": "contractor", "department": "External"},
    {"email": "contractor.3@argus.local",   "name": "Contractor Three", "tier": "contractor", "department": "External"},
]

def main():
    supabase = get_supabase()
    inserted = 0
    skipped = 0
    for user in USERS:
        existing = supabase.table("users").select("id").eq("email", user["email"]).execute()
        if existing.data:
            print(f"  [SKIP] {user['email']} already exists.")
            skipped += 1
            continue
        supabase.table("users").insert(user).execute()
        print(f"  [OK]   Inserted user: {user['name']} ({user['tier']})")
        inserted += 1

    print(f"\nDone. {inserted} inserted, {skipped} skipped.")

if __name__ == "__main__":
    main()
