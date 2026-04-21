from pydantic import BaseModel

from src.tools.contracts import ToolResult
from src.tools.mcp.mcp_client import MCPClient


class MCPRoute(BaseModel):
    internal_tool_name: str
    mcp_method_name: str


MCP_ROUTES: dict[str, MCPRoute] = {
    "get_service_incidents": MCPRoute(
        internal_tool_name="get_service_incidents",
        mcp_method_name="service_incidents.lookup",
    ),
    "create_escalation_artifact": MCPRoute(
        internal_tool_name="create_escalation_artifact",
        mcp_method_name="escalation.create",
    ),
}


class MCPRouter:
    def __init__(self, client: MCPClient):
        self.client = client
        self._available_methods: set[str] | None = None

    def _ensure_available_methods(self) -> set[str]:
        if self._available_methods is not None:
            return self._available_methods
        try:
            self._available_methods = set(self.client.list_tools())
        except Exception:
            # Keep permissive behavior when MCP server doesn't support tools/list.
            self._available_methods = set()
        return self._available_methods

    def can_call(self, internal_tool_name: str) -> bool:
        route = MCP_ROUTES.get(internal_tool_name)
        if not route:
            return False
        available = self._ensure_available_methods()
        if not available:
            return True
        return route.mcp_method_name in available

    def call(self, internal_tool_name: str, payload: dict) -> ToolResult:
        route = MCP_ROUTES.get(internal_tool_name)
        if not route:
            return ToolResult(
                tool_name=internal_tool_name,
                tool_source="mcp",
                success=False,
                findings={},
                errors=[f"No MCP route defined for {internal_tool_name}"],
                confidence=0.0,
            )
        if not self.can_call(internal_tool_name):
            return ToolResult(
                tool_name=internal_tool_name,
                tool_source="mcp",
                success=False,
                findings={},
                errors=[f"MCP method unavailable: {route.mcp_method_name}"],
                confidence=0.0,
            )
        try:
            raw = self.client.call_tool(route.mcp_method_name, payload)
            return ToolResult(
                tool_name=internal_tool_name,
                tool_source="mcp",
                success=True,
                findings=raw,
                confidence=0.8,
            )
        except Exception as ex:
            return ToolResult(
                tool_name=internal_tool_name,
                tool_source="mcp",
                success=False,
                findings={},
                errors=[str(ex)],
                confidence=0.0,
            )
