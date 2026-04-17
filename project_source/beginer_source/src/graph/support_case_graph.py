from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph

from src.domain.models import SupportCaseInput, SupportGraphState
from src.domain.outputs import SupportResolutionOutput
from src.domain.enums import DecisionType, IssueType
from src.agents.triage_agent import triage
from src.agents.retrieval_agent import gather_docs_evidence
from src.agents.tool_agent import gather_tool_evidence
from src.agents.decision_agent import decide
from src.agents.response_agent import generate_responses


class GraphState(TypedDict):
    case_input: SupportCaseInput
    issue_type: IssueType
    required_tools: list[str]
    missing_information: list[str]
    docs_evidence: list[dict]
    tool_evidence: list[dict]
    decision: DecisionType
    decision_rationale: str
    customer_response: str
    internal_note: str
    escalation_artifact_id: str | None


def _to_model(state: GraphState) -> SupportGraphState:
    return SupportGraphState(
        case_input=state["case_input"],
        issue_type=state.get("issue_type", IssueType.UNKNOWN),
        required_tools=state.get("required_tools", []),
        missing_information=state.get("missing_information", []),
        docs_evidence=state.get("docs_evidence", []),
        tool_evidence=state.get("tool_evidence", []),
        decision=state.get("decision", DecisionType.CLARIFY),
        decision_rationale=state.get("decision_rationale", ""),
        customer_response=state.get("customer_response", ""),
        internal_note=state.get("internal_note", ""),
        escalation_artifact_id=state.get("escalation_artifact_id"),
    )


def _to_state(model: SupportGraphState) -> GraphState:
    return {
        "case_input": model.case_input,
        "issue_type": model.issue_type,
        "required_tools": model.required_tools,
        "missing_information": model.missing_information,
        "docs_evidence": model.docs_evidence,
        "tool_evidence": model.tool_evidence,
        "decision": model.decision,
        "decision_rationale": model.decision_rationale,
        "customer_response": model.customer_response,
        "internal_note": model.internal_note,
        "escalation_artifact_id": model.escalation_artifact_id,
    }


def _triage_node(state: GraphState) -> GraphState:
    return _to_state(triage(_to_model(state)))


def _retrieval_node(state: GraphState) -> GraphState:
    return _to_state(gather_docs_evidence(_to_model(state)))


def _tools_node(state: GraphState) -> GraphState:
    return _to_state(gather_tool_evidence(_to_model(state)))


def _decision_node(state: GraphState) -> GraphState:
    return _to_state(decide(_to_model(state)))


def _response_node(state: GraphState) -> GraphState:
    return _to_state(generate_responses(_to_model(state)))


def _build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("triage", _triage_node)
    graph.add_node("retrieve", _retrieval_node)
    graph.add_node("tools", _tools_node)
    graph.add_node("decide", _decision_node)
    graph.add_node("respond", _response_node)

    graph.add_edge(START, "triage")
    graph.add_edge("triage", "retrieve")
    graph.add_edge("retrieve", "tools")
    graph.add_edge("tools", "decide")
    graph.add_edge("decide", "respond")
    graph.add_edge("respond", END)
    return graph.compile(checkpointer=InMemorySaver())


SUPPORT_CASE_GRAPH = _build_graph()


def run_support_case_graph(case_input: SupportCaseInput, thread_id: str | None = None) -> SupportResolutionOutput:
    initial_state: GraphState = {
        "case_input": case_input,
        "issue_type": IssueType.UNKNOWN,
        "required_tools": [],
        "missing_information": [],
        "docs_evidence": [],
        "tool_evidence": [],
        "decision": DecisionType.CLARIFY,
        "decision_rationale": "",
        "customer_response": "",
        "internal_note": "",
        "escalation_artifact_id": None,
    }
    invoke_config = {"configurable": {"thread_id": thread_id}} if thread_id else None
    final_state = SUPPORT_CASE_GRAPH.invoke(initial_state, config=invoke_config)

    return SupportResolutionOutput(
        issue_type=final_state["issue_type"].value,
        docs_evidence=final_state["docs_evidence"],
        tools_used=[x["tool_name"] for x in final_state["tool_evidence"]],
        important_findings=[str(x["findings"]) for x in final_state["tool_evidence"]],
        decision=final_state["decision"],
        decision_rationale=final_state["decision_rationale"],
        customer_response=final_state["customer_response"],
        internal_note=final_state["internal_note"],
        escalation_artifact_id=final_state["escalation_artifact_id"],
    )
