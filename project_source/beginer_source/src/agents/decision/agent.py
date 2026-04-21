from src.agents.decision.llm import decide_with_llm
from src.domain.enums import DecisionType, IssueType
from src.domain.models import SupportGraphState


def decide(state: SupportGraphState) -> SupportGraphState:
    llm_decision: DecisionType
    llm_rationale: str
    try:
        raw = decide_with_llm(
            case_title=state.case_input.title,
            case_description=state.case_input.description,
            missing_information=state.missing_information,
            docs_evidence=state.docs_evidence,
            tool_evidence=state.tool_evidence,
        )
        llm_decision = _parse_decision(raw.get("decision", "clarify"))
        llm_rationale = str(raw.get("decision_rationale", "")).strip() or "LLM provided empty rationale."
    except Exception:
        llm_decision, llm_rationale = _fallback_decision(state)

    state.decision, state.decision_rationale = _apply_decision_policy(state, llm_decision, llm_rationale)
    return state


def _parse_decision(raw: str) -> DecisionType:
    value = str(raw).strip().lower()
    if value == "resolve":
        return DecisionType.RESOLVE
    if value == "escalate":
        return DecisionType.ESCALATE
    return DecisionType.CLARIFY


def _apply_decision_policy(
    state: SupportGraphState,
    llm_decision: DecisionType,
    llm_rationale: str,
) -> tuple[DecisionType, str]:
    required_missing = _required_missing_identifiers(state)
    if required_missing:
        joined = ", ".join(required_missing)
        return DecisionType.CLARIFY, f"Policy: need {joined} before a confident resolution or escalation."

    if _policy_should_escalate(state):
        return (
            DecisionType.ESCALATE,
            "Policy: repeated or historically unresolved authentication issue; route to specialist review.",
        )

    if _policy_should_escalate_org_pat_failure(state):
        return (
            DecisionType.ESCALATE,
            "Policy: organization-scope PAT failure with SSO authorization mismatch requires specialist escalation.",
        )

    if _evidence_is_sufficient_for_resolution(state):
        rationale = llm_rationale or "Policy: evidence is sufficient and remediation guidance is clear."
        return DecisionType.RESOLVE, rationale

    return llm_decision, llm_rationale


def _required_missing_identifiers(state: SupportGraphState) -> list[str]:
    missing = {str(x).strip().lower() for x in state.missing_information if str(x).strip()}
    required: set[str] = set()
    if state.case_input.org_id is None:
        required.add("org_id")

    if state.issue_type == IssueType.TOKEN_AUTH:
        token_id = state.case_input.metadata.get("token_id")
        if not token_id:
            required.add("token_id")
    if state.issue_type in (IssueType.SAML_IDENTITY, IssueType.ENTITLEMENT, IssueType.BILLING):
        # Org context is mandatory to make account-scoped checks deterministic.
        if state.case_input.org_id is None:
            required.add("org_id")

    return sorted(x for x in missing if x in required)


def _evidence_is_sufficient_for_resolution(state: SupportGraphState) -> bool:
    has_docs = len(state.docs_evidence) > 0
    has_tools = len(state.tool_evidence) > 0
    if not has_docs:
        return False
    if state.issue_type == IssueType.REST_API:
        return "throttled_requests" in " ".join(str(x.get("findings", "")) for x in state.tool_evidence).lower()
    return has_tools


def _policy_should_escalate(state: SupportGraphState) -> bool:
    if not _issue_is_auth_adjacent(state):
        return False
    blob = f"{state.case_input.title} {state.case_input.description}".lower()
    text_markers = (
        "third reopen",
        "repeated unresolved",
        "multiple failed resolutions",
        "multiple unsuccessful",
        "multiple previous",
        "multiple support case",
        "still unresolved after",
        "recurring sso",
        "recurring token",
    )
    if any(m in blob for m in text_markers):
        return True
    return _case_history_has_repeated_unresolved(state.tool_evidence)


def _policy_should_escalate_org_pat_failure(state: SupportGraphState) -> bool:
    if state.issue_type != IssueType.TOKEN_AUTH:
        return False
    blob = f"{state.case_input.title} {state.case_input.description}".lower()
    org_scope_markers = (
        "organization resource",
        "organization resources",
        "org resources",
        "org-level",
        "organization-level",
        "org repo",
        "organization repo",
    )
    looks_org_scope = any(m in blob for m in org_scope_markers)
    if not looks_org_scope:
        return False
    return _token_findings_have_sso_mismatch(state.tool_evidence)


def _issue_is_auth_adjacent(state: SupportGraphState) -> bool:
    if state.issue_type in (IssueType.TOKEN_AUTH, IssueType.SAML_IDENTITY):
        return True
    blob = f"{state.case_input.title} {state.case_input.description}".lower()
    auth_kw = ("token", "pat", "sso", "saml", "auth", "login")
    if state.issue_type in (IssueType.MIXED, IssueType.UNKNOWN):
        return any(k in blob for k in auth_kw)
    return False


def _token_findings_have_sso_mismatch(tool_evidence: list[dict]) -> bool:
    for item in tool_evidence:
        findings = item.get("findings")
        if not isinstance(findings, dict):
            continue
        sso_authorized = findings.get("sso_authorized")
        if sso_authorized is False:
            return True
    return False


def _case_history_has_repeated_unresolved(tool_evidence: list[dict]) -> bool:
    for item in tool_evidence:
        findings = item.get("findings")
        if not isinstance(findings, dict):
            continue
        events = findings.get("events")
        if not isinstance(events, list):
            continue
        for ev in events:
            s = str(ev).lower()
            if "repeated" in s and "unresolved" in s:
                return True
    return False


def _fallback_decision(state: SupportGraphState) -> tuple[DecisionType, str]:
    findings_text = " ".join(str(x.get("findings", "")) for x in state.tool_evidence).lower()
    has_docs = len(state.docs_evidence) > 0
    if state.missing_information:
        return DecisionType.CLARIFY, "Missing required identifiers to continue targeted diagnostics."
    if "repeated unresolved" in findings_text:
        return DecisionType.ESCALATE, "Repeated unresolved case history indicates escalation path."
    if "throttled_requests" in findings_text or "high request volume" in findings_text:
        return DecisionType.RESOLVE, "Tool evidence and docs indicate rate limiting with clear mitigation."
    if "sso_authorized': false" in findings_text or "enabled': false" in findings_text:
        return (
            DecisionType.CLARIFY if has_docs else DecisionType.ESCALATE
        ), "Auth/entitlement mismatch needs validation or specialist escalation."
    return (DecisionType.RESOLVE if has_docs else DecisionType.CLARIFY), "Sufficient evidence available for initial guided resolution."
