from src.domain.models import SupportCaseInput
from src.domain.outputs import SupportResolutionOutput
from src.graph.support_case_graph import run_support_case_graph


def resolve_case(case_input: SupportCaseInput) -> SupportResolutionOutput:
    thread_id = case_input.thread_id or case_input.session_id or case_input.case_id
    return run_support_case_graph(case_input, thread_id=thread_id)
