from src.domain.models import SupportCaseInput
from src.graph.workflow import run_workflow


def test_workflow_returns_contract_fields():
    case = SupportCaseInput(
        case_id="S-1",
        title="API request issue",
        description="Requests fail with throttling symptoms",
        org_id="org-1",
    )
    out = run_workflow(case)
    assert out.decision in {"resolve", "clarify", "escalate"}
    assert out.docs_evidence
    assert out.internal_note
