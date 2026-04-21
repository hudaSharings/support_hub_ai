from src.agents.response.llm import generate_with_llm
from src.domain.enums import DecisionType
from src.domain.models import SupportGraphState


def generate_responses(state: SupportGraphState) -> SupportGraphState:
    try:
        raw = generate_with_llm(
            decision=state.decision.value,
            rationale=state.decision_rationale,
            docs_evidence=state.docs_evidence,
            tool_evidence=state.tool_evidence,
        )
        state.customer_response = str(raw.get("customer_response", "")).strip()
        state.internal_note = str(raw.get("internal_note", "")).strip()
        if not state.customer_response or not state.internal_note:
            raise ValueError("Incomplete response payload from LLM.")
    except Exception:
        if state.decision == DecisionType.CLARIFY:
            missing = [str(x).strip() for x in state.missing_information if str(x).strip()]
            if missing:
                needs = ", ".join(missing)
                state.customer_response = (
                    "To proceed, please share the following missing details: "
                    f"{needs}. Once we have these, we can continue resolution."
                )
                state.internal_note = f"Clarification requested for missing fields: {needs}."
            else:
                state.customer_response = (
                    "We need one concrete failing example to continue: include the exact action or endpoint, "
                    "timestamp, and full error message."
                )
                state.internal_note = "Clarification requested because current evidence is insufficient."
            return state

        if state.decision == DecisionType.ESCALATE:
            state.customer_response = "We have escalated this case to a specialist team and will update you shortly."
            state.internal_note = "Escalation response generated via fallback template."
        else:
            state.customer_response = (
                "We identified likely cause(s) and recommended actions based on documentation and account checks."
            )
            state.internal_note = "Resolved using combined documentation citations and tool findings."

    if state.decision == DecisionType.ESCALATE and not state.escalation_artifact_id:
        state.escalation_artifact_id = f"ESC-{state.case_input.case_id}"
        state.internal_note = f"{state.internal_note} Escalation artifact: {state.escalation_artifact_id}".strip()
    return state
