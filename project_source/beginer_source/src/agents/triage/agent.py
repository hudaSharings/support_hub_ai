from src.agents.tooling.registry import TOOL_NAMES
from src.agents.triage.llm import triage_with_llm
from src.domain.enums import IssueType
from src.domain.models import SupportGraphState


def triage(state: SupportGraphState) -> SupportGraphState:
    title = state.case_input.title
    description = state.case_input.description
    org_id = state.case_input.org_id

    try:
        llm_result = triage_with_llm(title, description, org_id)
        issue = _parse_issue_type(llm_result.get("issue_type", "unknown"))
        tools = _sanitize_tools(llm_result.get("required_tools", []))
        missing = _sanitize_missing(llm_result.get("missing_information", []), org_id)
    except Exception:
        # Safe fallback keeps app runnable when API key/network is unavailable.
        issue, tools, missing = _fallback_triage(title, description, org_id)

    state.issue_type = issue
    state.required_tools = tools
    state.missing_information = _enrich_missing_for_vague_reports(title, description, missing)
    return state


def _parse_issue_type(raw: str) -> IssueType:
    mapping = {
        "billing": IssueType.BILLING,
        "entitlement": IssueType.ENTITLEMENT,
        "token_auth": IssueType.TOKEN_AUTH,
        "rest_api": IssueType.REST_API,
        "saml_identity": IssueType.SAML_IDENTITY,
        "mixed": IssueType.MIXED,
        "unknown": IssueType.UNKNOWN,
    }
    return mapping.get(str(raw).strip().lower(), IssueType.UNKNOWN)


def _sanitize_tools(raw_tools: list) -> list[str]:
    tools = [str(x) for x in raw_tools if str(x) in TOOL_NAMES]
    if not tools:
        return ["get_service_incidents"]
    return tools


def _sanitize_missing(raw_missing: list, org_id: str | None) -> list[str]:
    missing = [str(x).strip().lower() for x in raw_missing if str(x).strip()]
    org_aliases = {"org_id", "org", "organization_id", "organization"}
    if org_id:
        missing = [x for x in missing if x not in org_aliases]
    if not org_id and "org_id" not in missing:
        missing.append("org_id")
    return _uniq_keep_order(missing)


def _enrich_missing_for_vague_reports(title: str, description: str, missing: list[str]) -> list[str]:
    text = f"{title}\n{description}".strip()
    low = text.lower()
    technical_anchor = any(
        x in low
        for x in (
            "401",
            "403",
            "404",
            "422",
            "429",
            "saml",
            "sso",
            "token",
            "pat ",
            "personal access",
            "billing",
            "invoice",
            "rate limit",
            "http",
            "api/",
            "graphql",
            "curl ",
        )
    )
    vague_markers = (
        "everything is failing",
        "nothing works",
        "github is broken",
        "random failures",
        "no reproducible",
        "platform unstable",
        "blocked but gives no",
        "does not provide endpoint",
    )
    if any(m in low for m in vague_markers) and not technical_anchor:
        extra = ["concrete_error_message_or_http_status", "affected_github_surface", "approximate_time_utc"]
        return _uniq_keep_order(missing + [x for x in extra if x not in missing])
    if len(text) < 48 and "broken" in low and not technical_anchor:
        return _uniq_keep_order(
            missing + [x for x in ("symptom_detail", "org_or_repo_scope") if x not in missing]
        )
    return missing


def _uniq_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _fallback_triage(title: str, description: str, org_id: str | None) -> tuple[IssueType, list[str], list[str]]:
    text = f"{title} {description}".lower()
    missing = ["org_id"] if not org_id else []

    if "billing" in text or "plan" in text:
        return IssueType.BILLING, ["get_subscription_state", "get_entitlement_status"], missing
    if "entitlement" in text or "feature" in text:
        return IssueType.ENTITLEMENT, ["get_entitlement_status", "get_subscription_state"], missing
    if "token" in text or "pat" in text:
        return IssueType.TOKEN_AUTH, ["diagnose_token_auth", "get_case_history"], missing
    if "saml" in text or "sso" in text:
        return IssueType.SAML_IDENTITY, ["get_case_history", "get_service_incidents"], missing
    if "rate" in text or "api" in text:
        return IssueType.REST_API, ["get_api_usage", "get_service_incidents"], missing
    if "broken" in text:
        return IssueType.UNKNOWN, ["get_service_incidents"], missing
    return IssueType.MIXED, ["get_subscription_state", "get_api_usage", "get_service_incidents"], missing
