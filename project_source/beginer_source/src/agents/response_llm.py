import json
import re

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from src.app.llm_client import complete_chat


RESPONSE_SYSTEM_PROMPT = (
    "You are a technical support response assistant. "
    "Generate concise customer_response and internal_note based on provided decision and evidence. "
    "Return strict JSON with fields: customer_response, internal_note."
)


def generate_with_llm(decision: str, rationale: str, docs_evidence: list[dict], tool_evidence: list[dict]) -> dict:
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", RESPONSE_SYSTEM_PROMPT),
            (
                "user",
                "Decision: {decision}\n"
                "Rationale: {rationale}\n"
                "Docs evidence: {docs_evidence}\n"
                "Tool evidence: {tool_evidence}\n"
                "Return JSON only.",
            ),
        ]
    )
    formatted = prompt.format_messages(
        decision=decision,
        rationale=rationale,
        docs_evidence=json.dumps(docs_evidence),
        tool_evidence=json.dumps(tool_evidence),
    )
    request_messages = [{"role": m.type, "content": m.content} for m in formatted]
    content = complete_chat(request_messages, temperature=0.2)
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
        raise ValueError("No JSON object found in response generator output.")
    return json.loads(match.group(0))
