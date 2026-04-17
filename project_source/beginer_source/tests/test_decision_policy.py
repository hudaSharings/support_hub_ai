from src.domain.models import SupportCaseInput, SupportGraphState
from src.agents.decision_agent import decide
from src.domain.enums import DecisionType


def test_decision_clarify_when_missing_info():
    state = SupportGraphState(case_input=SupportCaseInput(case_id="1", title="x", description="x"), missing_information=["org_id"])
    decided = decide(state)
    assert decided.decision == DecisionType.CLARIFY


def test_decision_escalate_on_repeated_unresolved():
    state = SupportGraphState(
        case_input=SupportCaseInput(case_id="2", title="x", description="x", org_id="org-pro"),
        tool_evidence=[{"findings": {"events": ["repeated unresolved token issue"]}}],
    )
    decided = decide(state)
    assert decided.decision == DecisionType.ESCALATE
