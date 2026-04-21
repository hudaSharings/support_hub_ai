import json
import re

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from src.app.llm_client import complete_chat


DECISION_SYSTEM_PROMPT = (
    "You are a technical support decision assistant. "
    "Use only provided evidence. "
    "Return strict JSON with fields: decision, decision_rationale. "
    "Valid decision values: resolve, clarify, escalate."
)


def decide_with_llm(
    case_title: str,
    case_description: str,
    missing_information: list[str],
    docs_evidence: list[dict],
    tool_evidence: list[dict],
) -> dict:
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", DECISION_SYSTEM_PROMPT),
            (
                "user",
                "Case title: {case_title}\n"
                "Case description: {case_description}\n"
                "Missing information: {missing_information}\n"
                "Docs evidence JSON: {docs_evidence}\n"
                "Tool evidence JSON: {tool_evidence}\n"
                "Return JSON only.",
            ),
        ]
    )
    formatted = prompt.format_messages(
        case_title=case_title,
        case_description=case_description,
        missing_information=json.dumps(missing_information),
        docs_evidence=json.dumps(docs_evidence),
        tool_evidence=json.dumps(tool_evidence),
    )
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
        raise ValueError("No JSON object found in decision response.")
    return json.loads(match.group(0))
