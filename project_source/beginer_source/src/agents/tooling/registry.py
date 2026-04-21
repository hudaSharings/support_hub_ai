from typing import Callable

from pydantic import BaseModel, ConfigDict

from src.tools.contracts import ToolResult
from src.tools.local.toolkit import (
    diagnose_token_auth,
    get_api_usage,
    get_case_history,
    get_entitlement_status,
    get_local_service_incidents,
    get_subscription_state,
)


class ToolContext(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)
    org_id: str
    token_id: str
    feature_name: str
    mcp_router: object


class ToolDefinition(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)
    name: str
    description: str
    executor: Callable[[ToolContext], list[ToolResult]]


def _run_subscription(ctx: ToolContext) -> list[ToolResult]:
    return [get_subscription_state(ctx.org_id)]


def _run_entitlement(ctx: ToolContext) -> list[ToolResult]:
    return [get_entitlement_status(ctx.org_id, ctx.feature_name)]


def _run_token_auth(ctx: ToolContext) -> list[ToolResult]:
    return [diagnose_token_auth(ctx.token_id)]


def _run_case_history(ctx: ToolContext) -> list[ToolResult]:
    return [get_case_history(ctx.org_id)]


def _run_api_usage(ctx: ToolContext) -> list[ToolResult]:
    return [get_api_usage(ctx.org_id)]


def _run_service_incidents(ctx: ToolContext) -> list[ToolResult]:
    # MCP-backed capability with local fallback for resilience.
    mcp_result = ctx.mcp_router.call("get_service_incidents", {"component": "api"})
    if mcp_result.success:
        return [mcp_result]
    return [get_local_service_incidents("api"), mcp_result]


TOOL_REGISTRY: dict[str, ToolDefinition] = {
    "get_subscription_state": ToolDefinition(
        name="get_subscription_state",
        description="Check organization subscription and billing state.",
        executor=_run_subscription,
    ),
    "get_entitlement_status": ToolDefinition(
        name="get_entitlement_status",
        description="Check feature entitlement for an organization.",
        executor=_run_entitlement,
    ),
    "diagnose_token_auth": ToolDefinition(
        name="diagnose_token_auth",
        description="Diagnose PAT/token authentication and authorization state.",
        executor=_run_token_auth,
    ),
    "get_case_history": ToolDefinition(
        name="get_case_history",
        description="Fetch prior support history for organization.",
        executor=_run_case_history,
    ),
    "get_api_usage": ToolDefinition(
        name="get_api_usage",
        description="Inspect API usage/rate-limiting signals.",
        executor=_run_api_usage,
    ),
    "get_service_incidents": ToolDefinition(
        name="get_service_incidents",
        description="Check service incident status via MCP with local fallback.",
        executor=_run_service_incidents,
    ),
}

TOOL_NAMES = list(TOOL_REGISTRY.keys())
