from src.domain.models import ToolResult


def local_usage_tool(case_text: str) -> ToolResult:
    return ToolResult(
        tool_name="get_api_usage",
        tool_source="local",
        success=True,
        findings={"signal": "high request volume" if "api" in case_text.lower() else "normal"},
        confidence=0.9,
    )


def mcp_incident_tool() -> ToolResult:
    return ToolResult(
        tool_name="get_service_incidents",
        tool_source="mcp",
        success=True,
        findings={"incidents": []},
        confidence=0.85,
    )
