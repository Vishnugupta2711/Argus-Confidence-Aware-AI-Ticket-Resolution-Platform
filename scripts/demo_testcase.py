#!/usr/bin/env python3
"""
Demo showing T001 test case structure
"""

import csv
from pathlib import Path

data_dir = Path(__file__).parent.parent / "data"

# Load T001 case
input_file = data_dir / "argus_pipeline_input.csv"
answers_file = data_dir / "argus_pipeline_answers.csv"

input_cases = {}
expected_answers = {}

with open(input_file) as f:
    reader = csv.DictReader(f)
    for row in reader:
        input_cases[row['ticket_ref']] = row

with open(answers_file) as f:
    reader = csv.DictReader(f)
    for row in reader:
        expected_answers[row['ticket_ref']] = row

# Show T001
ticket_ref = "T001"
case = input_cases[ticket_ref]
expected = expected_answers[ticket_ref]

print("\n" + "="*100)
print(f"EXAMPLE TEST CASE: {ticket_ref}")
print("="*100)

print("\n[INPUT DATA - What the user submits via the form]")
print(f"  Email:           {case['email']}")
print(f"  System:          {case['system_name']} (ID: {case['system_id'][:8]}...)")
print(f"  Category:        {case['category'] or '(EMPTY - Will be auto-detected)'}")
print(f"  Urgent:          {case['is_urgent']}")
print(f"  Description:     \"{case['description']}\"")

print("\n[EXPECTED PIPELINE OUTPUTS - What should happen]")
print(f"  ✓ Expected Category:      {expected['expected_category']}")
print(f"  ✓ Expected Severity:      {expected['expected_severity']}")
print(f"  ✓ Expected Status:        {expected['expected_status']}")
print(f"  ✓ Gate Triggered:         {expected['gate_triggered']}")
print(f"  ✓ Signal A (similarity):  {expected['signal_a_approx']}")
print(f"  ✓ Signal B:               {expected['signal_b_expected']}")
print(f"  ✓ Signal C:               {expected['signal_c_expected']}")
print(f"  ✓ All Signals Pass:       {expected['all_signals_pass']}")
print(f"  ✓ Sandbox Result:         {expected['sandbox_expected']}")
print(f"  ✓ Expected Resolution:    {expected['expected_resolution']}")

print(f"\n[DEMO INTENT]")
print(f"  {expected['demo_label']}")

print("\n" + "="*100)

print("\n[HOW TESTING WILL WORK]")
print("  1. You provide the input data (one row at a time)")
print("  2. Pipeline processes the ticket through all layers")
print("  3. We compare actual output against expected output")
print("  4. Shows which fields matched/mismatched")
print("\nReady to proceed with actual pipeline tests!")
print("\n")
