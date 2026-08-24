#!/usr/bin/env python3
"""
Run a single pipeline test case and compare against expected output
"""

import csv
import json
import sys
import asyncio
import uuid
from pathlib import Path
from typing import Dict, Any

# Add backend/ to sys.path so bare "from core.x", "from services.x" work
# (pipeline.py and its dependencies use these bare relative-style imports)
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from services.supabase import get_supabase
from core.pipeline import process_ticket


class TestRunner:
    def __init__(self, ticket_ref: str):
        self.ticket_ref = ticket_ref
        self.input_cases = {}
        self.expected_answers = {}
        self.supabase = get_supabase()
        self.qdrant_client = None

        # Load cluster map
        self.cluster_map = {}
        cluster_map_path = Path(__file__).parent.parent / "data" / "cluster_map.json"
        if cluster_map_path.exists():
            with open(cluster_map_path) as f:
                self.cluster_map = json.load(f)

        self.load_test_data()

    def load_test_data(self):
        """Load input and expected answer CSVs"""
        data_dir = Path(__file__).parent.parent / "data"

        # Load input data
        input_file = data_dir / "argus_pipeline_input.csv"
        with open(input_file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.input_cases[row["ticket_ref"]] = row

        # Load expected answers
        answers_file = data_dir / "argus_pipeline_answers.csv"
        with open(answers_file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.expected_answers[row["ticket_ref"]] = row

    async def run(self):
        """Run the pipeline for this ticket"""
        if self.ticket_ref not in self.input_cases:
            print(f"✗ Ticket {self.ticket_ref} not found in input data")
            return

        case = self.input_cases[self.ticket_ref]
        expected = self.expected_answers.get(self.ticket_ref, {})

        # Display input
        print("\n" + "=" * 120)
        print(f"RUNNING TEST CASE: {self.ticket_ref}")
        print("=" * 120)

        print("\n[INPUT DATA]")
        print(f"  Ticket Ref:      {self.ticket_ref}")
        print(f"  Email:           {case.get('email')}")
        print(
            f"  System:          {case.get('system_name')} (ID: {case.get('system_id')[:8]}...)"
        )
        print(
            f"  Category Input:  {case.get('category') or '(EMPTY - Will auto-detect)'}"
        )
        print(f"  Is Urgent:       {case.get('is_urgent')}")
        print(f'  Description:     "{case.get("description")}"')

        # Display expected outputs
        print("\n[EXPECTED OUTPUTS]")
        print(f"  Category:        {expected.get('expected_category', 'N/A')}")
        print(f"  Severity:        {expected.get('expected_severity', 'N/A')}")
        print(f"  Status:          {expected.get('expected_status', 'N/A')}")
        print(f"  Gate Triggered:  {expected.get('gate_triggered', 'none')}")
        if expected.get("gate_reason"):
            print(f"  Gate Reason:     {expected.get('gate_reason')[:80]}")
        print(f"  Signal A:        {expected.get('signal_a_approx', 'N/A')}")
        print(f"  All Signals OK:  {expected.get('all_signals_pass', 'N/A')}")
        print(f"  Sandbox:         {expected.get('sandbox_expected', 'N/A')}")
        print(f"  Resolution:      {expected.get('expected_resolution', 'N/A')}")
        print(f"  Demo Label:      {expected.get('demo_label', 'N/A')}")

        # Prepare ticket data for pipeline
        ticket_id = str(uuid.uuid4())

        # First, try to create the user if it doesn't exist
        user_email = case.get("email", "")
        try:
            user = self.supabase.get_user_by_email(user_email)
            user_id = user["id"] if user else None
        except:
            user_id = None

        # If user doesn't exist, create one
        if not user_id:
            try:
                user_id = str(uuid.uuid4())
                self.supabase.table("users").insert(
                    {
                        "id": user_id,
                        "email": user_email,
                        "name": user_email.split("@")[0],
                        "tier": "vip"
                        if user_email.startswith(("ceo@", "cfo@", "cto@"))
                        else "standard",
                        "department": "IT",
                    }
                ).execute()
                print(f"\n✓ Created user: {user_email}")
            except Exception as e:
                print(f"⚠ Could not create user: {e}")

        # Create ticket in database first
        try:
            self.supabase.table("tickets").insert(
                {
                    "id": ticket_id,
                    "user_id": user_id or str(uuid.uuid4()),
                    "description": case.get("description", ""),
                    "category": case.get("category", ""),
                    "severity": "P3",
                    "status": "processing",
                    "attachment_url": None,
                }
            ).execute()
            print(f"✓ Created ticket: {ticket_id}")
        except Exception as e:
            print(f"⚠ Could not create ticket in DB: {e}")

        ticket_dict = {
            "id": ticket_id,
            "description": case.get("description", ""),
            "category": case.get("category", ""),  # Empty if needs auto-detection
            "severity": "P3",  # Default
            "user_email": user_email,
            "system_name": case.get("system_name", ""),
            "attachment_url": None,
            "urgent": case.get("is_urgent", "false").lower() == "true",
        }

        # Run pipeline
        print(f"\n[RUNNING PIPELINE...]")
        try:
            result = await process_ticket(
                ticket_dict, self.supabase, self.qdrant_client, self.cluster_map
            )

            # Display actual outputs
            print(f"\n[ACTUAL OUTPUTS]")
            print(f"  Status:          {result.get('status', 'N/A')}")
            print(f"  Action:          {result.get('action', 'N/A')}")
            print(f"  Reason:          {result.get('reason', 'N/A')[:80]}")
            print(f"  Latency:         {result.get('latency_ms', 'N/A')}ms")

            # Show logs
            if result.get("logs"):
                print(f"\n[PIPELINE LOGS]")
                for log in result.get("logs", []):
                    print(f"  → {log}")

            # Compare
            print(f"\n[COMPARISON RESULT]")
            expected_status = expected.get("expected_status", "").lower()
            actual_status = result.get("status", "").lower()

            match = expected_status == actual_status
            symbol = "✓" if match else "✗"

            print(
                f"  {symbol} Status Match: Expected '{expected_status}' vs Got '{actual_status}'"
            )

            if match:
                print(f"\n✓ TEST PASSED - Status matches expected output!")
            else:
                print(f"\n✗ TEST FAILED - Status does not match!")

            # Additional details
            print(f"\n[FULL RESULT JSON]")
            print(json.dumps(result, indent=2))

        except Exception as e:
            print(f"\n✗ Pipeline execution failed: {e}")
            import traceback

            traceback.print_exc()

        print("\n" + "=" * 120 + "\n")


async def main():
    if len(sys.argv) < 2:
        print("Usage: python3 test_single.py <TICKET_REF>")
        print("Example: python3 test_single.py T003")
        sys.exit(1)

    ticket_ref = sys.argv[1].upper()
    runner = TestRunner(ticket_ref)
    await runner.run()


if __name__ == "__main__":
    asyncio.run(main())
