from src.domain.models import SupportCaseInput, SupportGraphState
from src.agents.decision.agent import decide
from src.domain.enums import DecisionType, IssueType


def test_decision_clarify_when_missing_info():
    state = SupportGraphState(case_input=SupportCaseInput(case_id="1", title="x", description="x"), missing_information=["org_id"])
    decided = decide(state)
    assert decided.decision == DecisionType.CLARIFY


def test_decision_escalate_on_repeated_unresolved():
    state = SupportGraphState(
        case_input=SupportCaseInput(case_id="2", title="PAT issue", description="token failing for org resources", org_id="org-pro"),
        issue_type=IssueType.TOKEN_AUTH,
        tool_evidence=[{"findings": {"events": ["repeated unresolved token issue"]}}],
    )
    decided = decide(state)
    assert decided.decision == DecisionType.ESCALATE


def test_decision_escalate_on_org_scope_pat_sso_mismatch():
    state = SupportGraphState(
        case_input=SupportCaseInput(
            case_id="3",
            title="PAT failing for organization resources",
            description="PAT works for user actions but fails for organization resources.",
            org_id="org_acme_platform",
            metadata={"token_id": "token_acme_gha_01"},
        ),
        issue_type=IssueType.TOKEN_AUTH,
        docs_evidence=[{"source_url": "https://docs.github.com/en/rest"}],
        tool_evidence=[{"findings": {"sso_authorized": False, "permissions": ["repo"], "revoked": False}}],
    )
    decided = decide(state)
    assert decided.decision == DecisionType.ESCALATE


def test_decision_does_not_clarify_on_non_required_missing_hint():
    state = SupportGraphState(
        case_input=SupportCaseInput(
            case_id="4",
            title="PAT failing for organization resources",
            description="PAT fails for org resources with explicit endpoint and errors captured.",
            org_id="org_acme_platform",
            metadata={"token_id": "token_acme_gha_01"},
        ),
        issue_type=IssueType.TOKEN_AUTH,
        missing_information=["approximate_time_utc"],
        docs_evidence=[{"source_url": "https://docs.github.com/en/rest"}],
        tool_evidence=[{"findings": {"sso_authorized": True, "permissions": ["read:org"]}}],
    )
    decided = decide(state)
    assert decided.decision == DecisionType.RESOLVE
