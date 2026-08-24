#!/usr/bin/env python3
"""
Batch pipeline test for T001-T010. Runs each ticket through the pipeline,
compares actual vs expected outputs, and prints a formatted match table.
"""

import asyncio
import csv
import json
import sys
import uuid
from pathlib import Path
from dataclasses import dataclass, field

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from services.supabase import get_supabase
from services.qdrant import get_qdrant_client
from core.pipeline import process_ticket


@dataclass
class TestResult:
    ticket_ref: str
    description: str
    expected_category: str = ""
    expected_severity: str = ""
    expected_status: str = ""
    expected_gate: str = ""
    actual_category: str = ""
    actual_severity: str = ""
    actual_status: str = ""
    actual_gate: str = ""
    actual_reason: str = ""
    actual_signal_a: str = ""
    actual_signal_b: str = ""
    actual_signal_c: str = ""
    actual_resolution: str = ""
    status_match: bool = False
    category_match: bool = False
    severity_match: bool = False
    error: str = ""
    logs: list = field(default_factory=list)


async def run_pipeline_for_case(
    case: dict, supabase, qdrant, cluster_map: dict
) -> TestResult:
    result = TestResult(
        ticket_ref=case["ticket_ref"],
        description=case["description"],
        expected_category=case.get("expected_category", ""),
        expected_severity=case.get("expected_severity", ""),
        expected_status=case.get("expected_status", ""),
        expected_gate=case.get("gate_triggered", "none"),
    )

    ticket_id = str(uuid.uuid4())
    user_email = case.get("email", "")

    try:
        user = supabase.get_user_by_email(user_email)
        user_id = user["id"] if user else None
    except Exception:
        user_id = None

    if not user_id:
        try:
            user_id = str(uuid.uuid4())
            supabase.table("users").insert(
                {
                    "id": user_id,
                    "email": user_email,
                    "name": user_email.split("@")[0].replace(".", " ").title(),
                    "tier": "vip"
                    if user_email.startswith(("ceo@", "cfo@", "cto@"))
                    else "standard",
                    "department": "IT",
                }
            ).execute()
        except Exception:
            pass

    try:
        supabase.table("tickets").insert(
            {
                "id": ticket_id,
                "user_id": user_id or str(uuid.uuid4()),
                "description": case.get("description", ""),
                "category": case.get("category", ""),
                "severity": "P3",
                "status": "processing",
            }
        ).execute()
    except Exception:
        pass

    ticket_dict = {
        "id": ticket_id,
        "description": case.get("description", ""),
        "category": case.get("category", ""),
        "severity": "P3",
        "user_email": user_email,
        "system_name": case.get("system_name", ""),
        "attachment_url": None,
        "urgent": case.get("is_urgent", "false").lower() == "true",
    }

    try:
        pipeline_result = await process_ticket(
            ticket_dict, supabase, qdrant, cluster_map
        )
        result.actual_status = pipeline_result.get("status", "")
        result.actual_reason = pipeline_result.get("reason", "")
        result.logs = pipeline_result.get("logs", [])

        conf_report = pipeline_result.get("confidence_report", {})
        signals = conf_report.get("signals", {}) if conf_report else {}

        sig_a_raw = signals.get("A")
        sig_b_raw = signals.get("B")
        sig_c_raw = signals.get("C")

        result.actual_signal_a = (
            f"{sig_a_raw.score:.3f}"
            if hasattr(sig_a_raw, "score")
            else (f"{float(sig_a_raw):.3f}" if sig_a_raw is not None else "N/A")
        )
        result.actual_signal_b = (
            f"{sig_b_raw.score:.3f}"
            if hasattr(sig_b_raw, "score")
            else (f"{float(sig_b_raw):.3f}" if sig_b_raw is not None else "N/A")
        )
        result.actual_signal_c = (
            f"{sig_c_raw.score:.3f}"
            if hasattr(sig_c_raw, "score")
            else (f"{float(sig_c_raw):.3f}" if sig_c_raw is not None else "N/A")
        )

        action_card = pipeline_result.get("action_payload", {})
        result.actual_category = action_card.get("category", "") or pipeline_result.get(
            "category", ""
        )
        result.actual_resolution = pipeline_result.get("resolution", "")

        if result.actual_status == "escalated":
            reason_lower = result.actual_reason.lower()
            if "vip" in reason_lower or "policy gate" in reason_lower:
                result.actual_gate = "policy_gate"
            elif "signal b" in reason_lower or "cohort consensus" in reason_lower:
                result.actual_gate = "signal_b"
            elif "novelty" in reason_lower or "similarity" in reason_lower:
                result.actual_gate = "novelty"
            elif "sandbox" in reason_lower:
                result.actual_gate = "sandbox"
            else:
                result.actual_gate = "unknown"
        else:
            result.actual_gate = "none"

        result.status_match = (
            result.expected_status.lower() == result.actual_status.lower()
        )
        result.category_match = (
            result.expected_category.lower() == result.actual_category.lower()
        )
        result.severity_match = (
            result.expected_severity.lower() == result.actual_severity.lower()
        )

    except Exception as e:
        result.error = str(e)

    return result


def load_test_data():
    data_dir = ROOT / "data"
    input_file = data_dir / "argus_pipeline_input.csv"
    answers_file = data_dir / "argus_pipeline_answers.csv"

    inputs = {}
    with open(input_file) as f:
        reader = csv.DictReader(f)
        for row in reader:
            inputs[row["ticket_ref"]] = row

    answers = {}
    with open(answers_file) as f:
        reader = csv.DictReader(f)
        for row in reader:
            answers[row["ticket_ref"]] = row

    merged = {}
    for ref in sorted(inputs.keys()):
        merged[ref] = {**inputs[ref], **answers.get(ref, {})}

    return merged


def print_table(results: list):
    header = (
        f"{'REF':<6} "
        f"{'STATUS (EXP→ACT)':<30} "
        f"{'CATEGORY (EXP→ACT)':<28} "
        f"{'GATE':<14} "
        f"{'SIGNALS':<22} "
        f"{'RESULT'}"
    )
    sep = "-" * 120

    print(f"\n{'=' * 120}")
    print("ARGUS PIPELINE TEST RESULTS — T011 to T025")
    print(f"{'=' * 120}\n")
    print(header)
    print(sep)

    passed = 0
    failed = 0

    for r in results:
        status_sym = "✓" if r.status_match else "✗"
        cat_sym = "✓" if r.category_match else "✗"

        sig_str = f"A={r.actual_signal_a[:4]} B={str(r.actual_signal_b)[:4]} C={str(r.actual_signal_c)[:4]}"

        status_col = f"{status_sym} {r.expected_status:<13}→ {r.actual_status:<13}"
        cat_col = f"{cat_sym} {r.expected_category:<13}→ {r.actual_category:<12}"
        gate_col = f"{r.expected_gate:<6}→ {r.actual_gate:<6}"
        result_col = "✓ PASS" if r.status_match else "✗ FAIL"

        if r.error:
            result_col = f"✗ ERROR: {r.error[:40]}"

        print(
            f"{r.ticket_ref:<6} {status_col:<30} {cat_col:<28} {gate_col:<14} {sig_str:<22} {result_col}"
        )

        if r.actual_reason and len(r.actual_reason) > 5:
            reason_short = r.actual_reason[:90]
            print(f"{'':>6}   Reason: {reason_short}")

        if r.logs:
            for log in r.logs[:3]:
                print(f"{'':>6}   Log: {log[:100]}")
        print()

        if r.status_match and not r.error:
            passed += 1
        else:
            failed += 1

    print(sep)
    print(f"\nSUMMARY: {passed}/{len(results)} passed")
    for r in results:
        if not r.status_match:
            print(
                f"  ✗ {r.ticket_ref}: expected status='{r.expected_status}', got '{r.actual_status}' | reason: {r.actual_reason[:80] if r.actual_reason else 'N/A'}"
            )
    print()


def write_csv(results: list, output_path: Path):
    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "ticket_ref",
                "description",
                "expected_category",
                "actual_category",
                "category_match",
                "expected_severity",
                "actual_severity",
                "severity_match",
                "expected_status",
                "actual_status",
                "status_match",
                "expected_gate",
                "actual_gate",
                "signal_a",
                "signal_b",
                "signal_c",
                "actual_resolution",
                "actual_reason",
                "logs",
                "error",
            ]
        )
        for r in results:
            writer.writerow(
                [
                    r.ticket_ref,
                    r.description,
                    r.expected_category,
                    r.actual_category,
                    r.category_match,
                    r.expected_severity,
                    r.actual_severity,
                    r.severity_match,
                    r.expected_status,
                    r.actual_status,
                    r.status_match,
                    r.expected_gate,
                    r.actual_gate,
                    r.actual_signal_a,
                    r.actual_signal_b,
                    r.actual_signal_c,
                    r.actual_resolution,
                    r.actual_reason[:200] if r.actual_reason else "",
                    " | ".join(r.logs[:5]) if r.logs else "",
                    r.error,
                ]
            )

    print(f"\n✓ Detailed results written to: {output_path}")


async def main():
    cluster_map = {}
    cluster_map_path = ROOT / "data" / "cluster_map.json"
    if cluster_map_path.exists():
        with open(cluster_map_path) as f:
            cluster_map = json.load(f)

    supabase = get_supabase()
    qdrant = get_qdrant_client()  # Already-initialized global client, not a coroutine

    all_cases = load_test_data()
    test_refs = [f"T{i:03d}" for i in range(11, 26)]

    print(f"\nRunning pipeline for: {', '.join(test_refs)}")
    print(f"Target: {len(test_refs)} tickets\n")

    results = []
    for ref in test_refs:
        if ref not in all_cases:
            print(f"✗ {ref} not found in test data — skipping")
            continue
        print(f"  Processing {ref}...", end=" ", flush=True)
        case = all_cases[ref]
        result = await run_pipeline_for_case(case, supabase, qdrant, cluster_map)
        status = "✓" if result.status_match and not result.error else "✗"
        print(f"{status} → {result.actual_status or 'ERROR'}")
        results.append(result)

    print_table(results)

    output_csv = ROOT / "data" / "pipeline_test_results_t011_t025.csv"
    write_csv(results, output_csv)


if __name__ == "__main__":
    asyncio.run(main())
