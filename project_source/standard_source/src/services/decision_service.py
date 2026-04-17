def choose_decision(missing: list[str], findings: list[str]) -> tuple[str, str]:
    if missing:
        return "clarify", "Missing required identifiers for diagnosis."
    if any("repeated unresolved" in x for x in findings):
        return "escalate", "Repeated unresolved pattern requires specialist support."
    if any("high request volume" in x for x in findings):
        return "resolve", "Evidence indicates rate limiting with clear mitigation."
    return "clarify", "Need additional details for confidence."
