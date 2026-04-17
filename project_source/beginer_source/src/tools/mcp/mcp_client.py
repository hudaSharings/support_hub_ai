import json
from urllib import request


class MCPClient:
    """
    Basic MCP HTTP JSON-RPC client.
    """

    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def call_tool(self, tool_name: str, payload: dict) -> dict:
        if not self.endpoint:
            raise ValueError("MCP_SERVER_URL is not configured.")

        rpc_payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": payload,
            },
        }
        req = request.Request(
            url=self.endpoint,
            data=json.dumps(rpc_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode("utf-8"))

        if "error" in body:
            raise RuntimeError(f"MCP call failed: {body['error']}")

        result = body.get("result")
        if result is None:
            raise RuntimeError("MCP response missing result.")
        return result
