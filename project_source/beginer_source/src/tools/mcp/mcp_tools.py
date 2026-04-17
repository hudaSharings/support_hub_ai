from src.tools.contracts import ToolResult


def get_service_incidents(client, component: str) -> ToolResult:
    try:
        raw = client.call_tool("service_incidents.lookup", {"component": component})
        return ToolResult(
            tool_name="get_service_incidents",
            tool_source="mcp",
            success=True,
            findings=raw,
            confidence=0.8,
        )
    except Exception as ex:
        return ToolResult(
            tool_name="get_service_incidents",
            tool_source="mcp",
            success=False,
            findings={"component": component, "incidents": []},
            errors=[str(ex)],
            confidence=0.0,
        )


def create_escalation_artifact(client, case_id: str, reason: str) -> ToolResult:
    try:
        raw = client.call_tool("escalation.create", {"case_id": case_id, "reason": reason})
        return ToolResult(
            tool_name="create_escalation_artifact",
            tool_source="mcp",
            success=True,
            findings=raw,
            confidence=0.85,
        )
    except Exception as ex:
        return ToolResult(
            tool_name="create_escalation_artifact",
            tool_source="mcp",
            success=False,
            findings={"artifact_id": f"ESC-{case_id}"},
            errors=[str(ex)],
            confidence=0.0,
        )
