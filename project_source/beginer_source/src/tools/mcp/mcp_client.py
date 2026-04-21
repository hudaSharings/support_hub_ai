import json
from urllib import request


class MCPClient:
    """
    Basic MCP HTTP JSON-RPC client.
    """

    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def _call_rpc(self, method: str, params: dict, rpc_id: int = 1) -> dict:
        if not self.endpoint:
            raise ValueError("MCP_SERVER_URL is not configured.")

        rpc_payload = {
            "jsonrpc": "2.0",
            "id": rpc_id,
            "method": method,
            "params": params,
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

    def call_tool(self, tool_name: str, payload: dict) -> dict:
        return self._call_rpc(
            "tools/call",
            {
                "name": tool_name,
                "arguments": payload,
            },
            rpc_id=1,
        )

    def list_tools(self) -> list[str]:
        result = self._call_rpc("tools/list", {}, rpc_id=2)
        tools = result.get("tools", [])
        names = [t.get("name") for t in tools if isinstance(t, dict) and t.get("name")]
        return [str(name) for name in names]
