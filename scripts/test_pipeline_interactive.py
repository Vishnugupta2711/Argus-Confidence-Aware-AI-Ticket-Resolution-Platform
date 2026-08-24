#!/usr/bin/env python3
"""
Argus Pipeline Interactive Test Terminal
Loads input and expected answers from CSV files for step-by-step testing
"""

import asyncio
import sys
import json
import csv
from pathlib import Path
from typing import Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from backend.services.supabase import get_supabase
from backend.services.qdrant import get_qdrant_client
from backend.core.pipeline import process_ticket


@dataclass
class TestCase:
    ticket_ref: str
    email: str
    system_id: str
    system_name: str
    category: str
    is_urgent: bool
    description: str
    expected_category: str
    expected_severity: str
    expected_status: str
    gate_triggered: str
    gate_reason: str
    escalation_reason: str
    demo_label: str


class PipelineTestSimulator:
    def __init__(self):
        self.input_data: List[Dict] = []
        self.expected_answers: Dict[str, Dict] = {}
        self.current_case = None
        self.supabase = get_supabase()
        self.qdrant = None
        
        # Load cluster map
        self.cluster_map = {}
        cluster_map_path = Path(__file__).parent.parent / "data" / "cluster_map.json"
        if cluster_map_path.exists():
            with open(cluster_map_path) as f:
                self.cluster_map = json.load(f)
                
        self.load_test_data()

    def load_test_data(self):
        """Load input and expected answer CSVs"""
        input_file = Path(__file__).parent.parent / "data" / "argus_pipeline_input.csv"
        answers_file = Path(__file__).parent.parent / "data" / "argus_pipeline_answers.csv"
        
        # Load input data
        if input_file.exists():
            with open(input_file) as f:
                reader = csv.DictReader(f)
                self.input_data = list(reader)
            print(f"✓ Loaded {len(self.input_data)} test cases from input CSV")
        else:
            print(f"✗ Input file not found: {input_file}")
            return
        
        # Load expected answers
        if answers_file.exists():
            with open(answers_file) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.expected_answers[row['ticket_ref']] = row
            print(f"✓ Loaded {len(self.expected_answers)} expected answers")
        else:
            print(f"✗ Answers file not found: {answers_file}")
            return
    
    async def initialize(self):
        """Initialize async resources"""
        try:
            self.qdrant = await get_qdrant_client()
            print("✓ Connected to Qdrant")
        except Exception as e:
            print(f"⚠ Qdrant connection failed: {e}")
        
        print("✓ Test simulator ready\n")
    
    def print_menu(self):
        """Print menu of available test cases"""
        print("\n" + "="*80)
        print("ARGUS PIPELINE TEST TERMINAL")
        print("="*80)
        print(f"\nAvailable test cases: {len(self.input_data)}\n")
        
        for i, case in enumerate(self.input_data, 1):
            status = "✓" if case['ticket_ref'] in self.expected_answers else "?"
            expected = self.expected_answers.get(case['ticket_ref'], {})
            label = expected.get('demo_label', 'No label')
            print(f"{i:2d}. {case['ticket_ref']} | {case['system_name']:20s} | {label[:50]}")
        
        print("\nCommands:")
        print("  <number>     - Run test case by number (e.g., '1')")
        print("  list         - Show all test cases")
        print("  quit/exit    - Exit simulator")
        print("\n> ", end="", flush=True)
    
    async def run_test_case(self, case_num: int):
        """Run a specific test case"""
        if case_num < 1 or case_num > len(self.input_data):
            print(f"✗ Invalid case number. Please choose 1-{len(self.input_data)}")
            return
        
        case_data = self.input_data[case_num - 1]
        ticket_ref = case_data['ticket_ref']
        expected = self.expected_answers.get(ticket_ref, {})
        
        print(f"\n{'='*80}")
        print(f"TEST CASE: {ticket_ref}")
        print(f"{'='*80}")
        
        # Display input
        print("\n[INPUT]")
        print(f"  Email:       {case_data['email']}")
        print(f"  System:      {case_data['system_name']} ({case_data['system_id'][:8]}...)")
        print(f"  Category:    {case_data['category'] or '(auto-detect)'}")
        print(f"  Urgent:      {case_data['is_urgent']}")
        print(f"  Description: {case_data['description'][:60]}...")
        
        # Display expected outputs
        if expected:
            print(f"\n[EXPECTED OUTPUTS]")
            print(f"  Category:         {expected.get('expected_category', 'N/A')}")
            print(f"  Severity:         {expected.get('expected_severity', 'N/A')}")
            print(f"  Status:           {expected.get('expected_status', 'N/A')}")
            print(f"  Gate Triggered:   {expected.get('gate_triggered', 'none')}")
            if expected.get('gate_reason'):
                print(f"  Gate Reason:      {expected.get('gate_reason', 'N/A')[:70]}")
            if expected.get('escalation_reason'):
                print(f"  Escalation:       {expected.get('escalation_reason', 'N/A')[:70]}")
            print(f"  Demo Label:       {expected.get('demo_label', 'N/A')}")
        else:
            print(f"\n⚠ No expected answers found for {ticket_ref}")
        
        # Run pipeline
        print(f"\n[RUNNING PIPELINE...]")
        try:
            # Prepare ticket data
            ticket_dict = {
                "id": ticket_ref,  # Use ref as ID for testing
                "description": case_data['description'],
                "category": case_data['category'] or "",
                "severity": "P3",  # Default - would be detected by policy gate
                "user_email": case_data['email'],
                "system_name": case_data['system_name'],
                "attachment_url": None,
                "urgent": case_data['is_urgent'].lower() == 'true',
            }
            
            # Run pipeline
            result = await process_ticket(
                ticket_dict,
                self.supabase,
                self.qdrant,
                self.cluster_map
            )
            
            # Display results
            print(f"\n[ACTUAL OUTPUTS]")
            print(f"  Status:   {result.get('status', 'N/A')}")
            print(f"  Action:   {result.get('action', 'N/A')}")
            print(f"  Reason:   {result.get('reason', 'N/A')[:70]}")
            print(f"  Latency:  {result.get('latency_ms', 'N/A')}ms")
            
            if result.get('logs'):
                print(f"\n[PIPELINE LOGS]")
                for log in result.get('logs', []):
                    print(f"  → {log}")
            
            # Compare results
            if expected:
                print(f"\n[COMPARISON]")
                issues = []
                
                expected_status = expected.get('expected_status', '').lower()
                actual_status = result.get('status', '').lower()
                match_status = "✓" if expected_status == actual_status else "✗"
                print(f"  {match_status} Status: expected={expected_status}, actual={actual_status}")
                if expected_status != actual_status:
                    issues.append(f"Status mismatch")
                
                # Compare category (if ticket was processed)
                if actual_status in ['auto_resolved', 'escalated']:
                    # Would need to fetch from DB to compare actual category
                    print(f"  ? Category: Check database for actual value")
                
                if issues:
                    print(f"\n⚠ ISSUES FOUND: {', '.join(issues)}")
                else:
                    print(f"\n✓ ALL OUTPUTS MATCH EXPECTED!")
            
            # Offer next steps
            print(f"\n{'='*80}")
            print("Next: Type another test case number, 'list', or 'quit'")
            
        except Exception as e:
            print(f"\n✗ Pipeline execution failed: {e}")
            import traceback
            traceback.print_exc()
    
    async def run(self):
        """Main interactive loop"""
        await self.initialize()
        
        while True:
            self.print_menu()
            try:
                user_input = input().strip().lower()
                
                if user_input in ['quit', 'exit', 'q']:
                    print("\n✓ Goodbye!")
                    break
                elif user_input == 'list':
                    continue
                elif user_input.isdigit():
                    case_num = int(user_input)
                    await self.run_test_case(case_num)
                else:
                    print(f"Unknown command: {user_input}")
                    
            except KeyboardInterrupt:
                print("\n\n✓ Goodbye!")
                break
            except Exception as e:
                print(f"✗ Error: {e}")


async def main():
    simulator = PipelineTestSimulator()
    await simulator.run()


if __name__ == "__main__":
    asyncio.run(main())
