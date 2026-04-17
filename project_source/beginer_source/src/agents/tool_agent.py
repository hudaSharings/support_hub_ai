from src.domain.models import SupportGraphState
from src.tools.local.toolkit import (
    get_subscription_state,
    get_entitlement_status,
    diagnose_token_auth,
    get_case_history,
    get_api_usage,
    get_local_service_incidents,
)
from src.tools.mcp.mcp_client import MCPClient
from src.tools.mcp.mcp_tools import get_service_incidents
from src.app.config import settings


def gather_tool_evidence(state: SupportGraphState) -> SupportGraphState:
    org_id = state.case_input.org_id or "org-free"
    token_id = state.case_input.metadata.get("token_id", "token-fail")
    feature_name = state.case_input.metadata.get("feature_name", "advanced_security")
    mcp_client = MCPClient(settings.mcp_server_url)

    tool_results = []
    for tool_name in state.required_tools:
        if tool_name == "get_subscription_state":
            tool_results.append(get_subscription_state(org_id))
        elif tool_name == "get_entitlement_status":
            tool_results.append(get_entitlement_status(org_id, feature_name))
        elif tool_name == "diagnose_token_auth":
            tool_results.append(diagnose_token_auth(token_id))
        elif tool_name == "get_case_history":
            tool_results.append(get_case_history(org_id))
        elif tool_name == "get_api_usage":
            tool_results.append(get_api_usage(org_id))
        elif tool_name == "get_service_incidents":
            # MCP-backed capability with local fallback for resilience.
            mcp_result = get_service_incidents(mcp_client, "api")
            if mcp_result.success:
                tool_results.append(mcp_result)
            else:
                tool_results.append(get_local_service_incidents("api"))
                tool_results.append(mcp_result)

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
