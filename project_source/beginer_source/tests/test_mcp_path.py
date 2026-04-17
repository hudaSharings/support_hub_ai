from src.tools.mcp.mcp_client import MCPClient
from src.tools.mcp.mcp_tools import get_service_incidents


def test_mcp_incident_tool_path():
    client = MCPClient("")
    result = get_service_incidents(client, "api")
    assert result.tool_source == "mcp"
    assert result.success is False
    assert result.errors
