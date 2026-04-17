from src.domain.models import SupportCaseInput
from src.workflow.case_resolution import resolve_case


def test_pipeline_smoke():
    case = SupportCaseInput(
        case_id="SMOKE-1",
        title="API rate issue",
        description="Automation failing with signs of throttling",
        org_id="org-pro",
    )
    out = resolve_case(case)
    assert out.decision in {"resolve", "clarify", "escalate"}
    assert out.customer_response
