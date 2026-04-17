from src.domain.models import SupportCaseInput, SupportResolutionOutput
from src.rag.retriever import retrieve_docs
from src.services.decision_service import choose_decision
from src.tools.tool_adapters import local_usage_tool, mcp_incident_tool


def run_workflow(case_input: SupportCaseInput) -> SupportResolutionOutput:
    text = f"{case_input.title} {case_input.description}"
    docs_evidence = retrieve_docs(text)
    tool_results = [local_usage_tool(text), mcp_incident_tool()]
    tools_used = [t.tool_name for t in tool_results]
    findings = [str(t.findings) for t in tool_results]
    missing = [] if case_input.org_id else ["org_id"]

    decision, rationale = choose_decision(missing, findings)
    if decision == "resolve":
        customer_response = "Issue appears related to API usage limits. Please apply pacing and retry."
    elif decision == "clarify":
        customer_response = "Please share org id, failing endpoint, timestamp, and full error text."
    else:
        customer_response = "We are escalating this case to a specialist team."

    return SupportResolutionOutput(
        issue_type="technical_support",
        docs_evidence=docs_evidence,
        tools_used=tools_used,
        important_findings=findings,
        decision=decision,
        decision_rationale=rationale,
        customer_response=customer_response,
        internal_note=f"Decision={decision}; tools={tools_used}",
        escalation_artifact_id="ESC-DEMO-1" if decision == "escalate" else None,
    )
