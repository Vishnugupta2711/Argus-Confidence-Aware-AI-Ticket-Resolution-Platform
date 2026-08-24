#!/usr/bin/env python3
"""
Direct Argus Pipeline Test - Run individual tickets and compare against expected outputs
"""

import csv
import json
from pathlib import Path
from typing import Dict, List


class PipelineAnswerValidator:
    def __init__(self):
        self.input_cases: Dict[str, Dict] = {}
        self.expected_answers: Dict[str, Dict] = {}
        self.load_data()
    
    def load_data(self):
        """Load input and expected answer CSVs"""
        data_dir = Path(__file__).parent.parent / "data"
        
        # Load input data
        input_file = data_dir / "argus_pipeline_input.csv"
        if input_file.exists():
            with open(input_file) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.input_cases[row['ticket_ref']] = row
            print(f"✓ Loaded {len(self.input_cases)} test cases from input CSV")
        else:
            print(f"✗ Input file not found: {input_file}")
            return
        
        # Load expected answers
        answers_file = data_dir / "argus_pipeline_answers.csv"
        if answers_file.exists():
            with open(answers_file) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.expected_answers[row['ticket_ref']] = row
            print(f"✓ Loaded {len(self.expected_answers)} expected answers")
        else:
            print(f"✗ Answers file not found: {answers_file}")
    
    def show_case(self, ticket_ref: str):
        """Display a test case and expected output"""
        if ticket_ref not in self.input_cases:
            print(f"✗ Case '{ticket_ref}' not found")
            return False
        
        case = self.input_cases[ticket_ref]
        expected = self.expected_answers.get(ticket_ref, {})
        
        print(f"\n{'='*100}")
        print(f"TEST CASE: {ticket_ref}")
        print(f"{'='*100}")
        
        # Input data
        print(f"\n[INPUT DATA]")
        print(f"  Email:           {case.get('email')}")
        print(f"  System:          {case.get('system_name')} (ID: {case.get('system_id')[:8]}...)")
        print(f"  Category:        {case.get('category') or '(EMPTY - AUTO-DETECT REQUIRED)'}")
        print(f"  Urgent:          {case.get('is_urgent')}")
        print(f"  Description:     {case.get('description')}")
        
        # Expected outputs
        if expected:
            print(f"\n[EXPECTED OUTPUTS]")
            print(f"  Expected Category:         {expected.get('expected_category', 'N/A')}")
            print(f"  Expected Severity:         {expected.get('expected_severity', 'N/A')}")
            print(f"  Expected Status:           {expected.get('expected_status', 'N/A')}")
            print(f"  Gate Triggered:            {expected.get('gate_triggered', 'none')}")
            
            if expected.get('gate_reason'):
                print(f"  Gate Reason:               {expected.get('gate_reason')}")
            
            if expected.get('signal_a_approx'):
                print(f"  Signal A (similarity):     {expected.get('signal_a_approx')}")
            
            if expected.get('all_signals_pass'):
                print(f"  All Signals Pass:          {expected.get('all_signals_pass')}")
            
            if expected.get('escalation_reason'):
                print(f"  Escalation Reason:         {expected.get('escalation_reason')}")
            
            print(f"\n  Expected Resolution:")
            print(f"  {expected.get('expected_resolution', 'N/A')}")
            
            print(f"\n  Demo Label:")
            print(f"  {expected.get('demo_label', 'N/A')}")
        else:
            print(f"\n⚠ WARNING: No expected answers found for {ticket_ref}")
        
        print(f"\n{'='*100}")
        return True
    
    def show_all_cases(self):
        """Show all available test cases"""
        print(f"\n{'='*100}")
        print("ALL AVAILABLE TEST CASES")
        print(f"{'='*100}\n")
        
        for i, ticket_ref in enumerate(sorted(self.input_cases.keys()), 1):
            case = self.input_cases[ticket_ref]
            expected = self.expected_answers.get(ticket_ref, {})
            status = "✓" if expected else "?"
            demo = expected.get('demo_label', 'N/A')[:60]
            
            print(f"{i:2d}. {status} {ticket_ref} | {case.get('system_name'):20s} | {demo}")
        
        print(f"\n{'='*100}\n")
    
    def run_interactive(self):
        """Run interactive test terminal"""
        print(f"\n{'='*100}")
        print("ARGUS PIPELINE TEST TERMINAL v1.0")
        print(f"{'='*100}")
        print("\nThis terminal lets you inspect test cases before running the actual pipeline.")
        print("Once you understand the expected outputs, the pipeline will be run against them.\n")
        
        while True:
            print("\nCommands:")
            print("  list              - Show all test cases")
            print("  <ticket_ref>      - Show test case details (e.g., 'T001')")
            print("  quit/exit         - Exit terminal")
            print("\n> ", end="", flush=True)
            
            try:
                user_input = input().strip().upper()
                
                if user_input in ['QUIT', 'EXIT', 'Q']:
                    print("\n✓ Test terminal closed. Ready to run pipeline tests!")
                    break
                elif user_input == 'LIST':
                    self.show_all_cases()
                elif user_input.startswith('T') and user_input[1:].isdigit():
                    self.show_case(user_input)
                else:
                    print(f"Unknown command: {user_input}")
            
            except KeyboardInterrupt:
                print("\n\n✓ Test terminal closed.")
                break
            except Exception as e:
                print(f"✗ Error: {e}")


if __name__ == "__main__":
    validator = PipelineAnswerValidator()
    validator.run_interactive()
