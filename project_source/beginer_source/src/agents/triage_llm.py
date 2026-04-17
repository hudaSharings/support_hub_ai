import json
import re

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from src.app.config import settings
from src.app.llm_client import complete_chat


TRIAGE_SYSTEM_PROMPT = (
    "You are a support case triage assistant for GitHub.com support operations. "
    "Classify the issue and propose required tools. "
    "Return strict JSON only with fields: "
    "issue_type, required_tools, missing_information. "
    "Valid issue_type: billing, entitlement, token_auth, rest_api, saml_identity, mixed, unknown. "
    "Valid tools: get_subscription_state, get_entitlement_status, diagnose_token_auth, "
    "get_case_history, get_api_usage, get_service_incidents."
)


def triage_with_llm(title: str, description: str, org_id: str | None) -> dict:
    """
    Call configured LLM provider chat completions API and parse structured triage output.
    Raises ValueError on parsing failure; caller should fallback safely.
    """
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is missing.")

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", TRIAGE_SYSTEM_PROMPT),
            (
                "user",
                "Case title: {title}\n"
                "Case description: {description}\n"
                "Org id present: {org_id_present}\n"
                "Return JSON only.",
            ),
        ]
    )
    formatted = prompt.format_messages(title=title, description=description, org_id_present=bool(org_id))
    request_messages = [{"role": m.type, "content": m.content} for m in formatted]

    content = complete_chat(request_messages, temperature=0.0)
    return _extract_json(content)


def _extract_json(content: str) -> dict:
    parser = JsonOutputParser()
    try:
        parsed = parser.parse(content)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM response.")
    return json.loads(match.group(0))
