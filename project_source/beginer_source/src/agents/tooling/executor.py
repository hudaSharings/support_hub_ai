from src.agents.tooling.registry import TOOL_REGISTRY, ToolContext
from src.app.config import settings
from src.domain.models import SupportGraphState
from src.tools.mcp.mcp_client import MCPClient
from src.tools.mcp.router import MCPRouter


def gather_tool_evidence(state: SupportGraphState) -> SupportGraphState:
    org_id = state.case_input.org_id or "org-free"
    token_id = state.case_input.metadata.get("token_id", "token-fail")
    feature_name = state.case_input.metadata.get("feature_name", "advanced_security")
    mcp_router = MCPRouter(MCPClient(settings.mcp_server_url))

    context = ToolContext(
        org_id=org_id,
        token_id=token_id,
        feature_name=feature_name,
        mcp_router=mcp_router,
    )

    tool_results = []
    for tool_name in state.required_tools:
        definition = TOOL_REGISTRY.get(tool_name)
        if not definition:
            continue
        tool_results.extend(definition.executor(context))

    state.tool_evidence = [
        {
            "tool_name": t.tool_name,
            "tool_source": t.tool_source,
            "success": t.success,
            "findings": t.findings,
            "errors": t.errors,
            "confidence": t.confidence,
        }
        for t in tool_results
    ]
    return state
