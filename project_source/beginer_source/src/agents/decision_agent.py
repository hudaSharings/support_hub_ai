from src.domain.enums import DecisionType
from src.domain.models import SupportGraphState
from src.agents.decision_llm import decide_with_llm


def decide(state: SupportGraphState) -> SupportGraphState:
    try:
        raw = decide_with_llm(
            case_title=state.case_input.title,
            case_description=state.case_input.description,
            missing_information=state.missing_information,
            docs_evidence=state.docs_evidence,
            tool_evidence=state.tool_evidence,
        )
        state.decision = _parse_decision(raw.get("decision", "clarify"))
        state.decision_rationale = str(raw.get("decision_rationale", "")).strip() or "LLM provided empty rationale."
    except Exception:
        state.decision, state.decision_rationale = _fallback_decision(state)
    return state


def _parse_decision(raw: str) -> DecisionType:
    value = str(raw).strip().lower()
    if value == "resolve":
        return DecisionType.RESOLVE
    if value == "escalate":
        return DecisionType.ESCALATE
    return DecisionType.CLARIFY


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
        return (DecisionType.CLARIFY if has_docs else DecisionType.ESCALATE), "Auth/entitlement mismatch needs validation or specialist escalation."
    return (DecisionType.RESOLVE if has_docs else DecisionType.CLARIFY), "Sufficient evidence available for initial guided resolution."
