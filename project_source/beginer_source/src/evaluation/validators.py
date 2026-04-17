def validate_output(payload: dict) -> None:
    required = [
        "issue_type",
        "docs_evidence",
        "tools_used",
        "important_findings",
        "decision",
        "decision_rationale",
        "customer_response",
        "internal_note",
    ]
    missing = [k for k in required if k not in payload or payload[k] in ("", None)]
    if missing:
        raise ValueError(f"Missing required output fields: {missing}")

    if payload["decision"] != "clarify" and not payload["docs_evidence"]:
        raise ValueError("Non-clarify decisions must include docs evidence.")

    if payload["decision"] == "escalate" and not payload.get("escalation_artifact_id"):
        raise ValueError("Escalate decision must include escalation artifact id.")
