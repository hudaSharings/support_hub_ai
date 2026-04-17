from pathlib import Path
import json

from src.tools.contracts import ToolResult


def _load_store() -> dict:
    path = Path(__file__).resolve().parents[2] / "data" / "mock_business_data.json"
    return json.loads(path.read_text())


def get_subscription_state(org_id: str) -> ToolResult:
    store = _load_store()
    org = store.get("organizations", {}).get(org_id, {})
    return ToolResult(
        tool_name="get_subscription_state",
        tool_source="local",
        success=bool(org),
        findings={"org_id": org_id, "plan": org.get("current_plan"), "billing_status": org.get("billing_status")},
        confidence=0.9 if org else 0.0,
    )


def get_entitlement_status(org_id: str, feature_name: str) -> ToolResult:
    store = _load_store()
    enabled = bool(store.get("entitlements", {}).get(org_id, {}).get(feature_name, False))
    return ToolResult(
        tool_name="get_entitlement_status",
        tool_source="local",
        success=True,
        findings={"org_id": org_id, "feature_name": feature_name, "enabled": enabled},
        confidence=0.95,
    )


def diagnose_token_auth(token_id: str) -> ToolResult:
    store = _load_store()
    token = store.get("tokens", {}).get(token_id, {})
    return ToolResult(
        tool_name="diagnose_token_auth",
        tool_source="local",
        success=bool(token),
        findings=token if token else {"token_id": token_id, "missing": True},
        confidence=0.85 if token else 0.0,
    )


def get_case_history(org_id: str) -> ToolResult:
    store = _load_store()
    history = store.get("case_history", {}).get(org_id, [])
    return ToolResult(
        tool_name="get_case_history",
        tool_source="local",
        success=True,
        findings={"org_id": org_id, "events": history},
        confidence=0.8,
    )


def get_api_usage(org_id: str) -> ToolResult:
    store = _load_store()
    usage = store.get("api_usage", {}).get(org_id, {})
    return ToolResult(
        tool_name="get_api_usage",
        tool_source="local",
        success=bool(usage),
        findings=usage if usage else {"request_count": 0, "throttled_requests": 0},
        confidence=0.9 if usage else 0.6,
    )


def get_local_service_incidents(component: str) -> ToolResult:
    store = _load_store()
    incidents = store.get("incidents", {}).get(component, [])
    return ToolResult(
        tool_name="get_service_incidents",
        tool_source="local",
        success=True,
        findings={"component": component, "incidents": incidents},
        confidence=0.7,
    )
