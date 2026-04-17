import json
from urllib import request

from src.app.config import settings


def complete_chat(messages: list[dict], temperature: float = 0.0) -> str:
    """
    Provider-agnostic chat completion helper using OpenAI-compatible API schema.
    """
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is missing.")

    payload = {
        "model": settings.llm_model,
        "temperature": temperature,
        "messages": messages,
    }
    url = f"{settings.llm_api_base_url.rstrip('/')}{settings.llm_chat_completions_path}"
    req = request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    choices = body.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("LLM response missing 'choices'.")
    first = choices[0]
    if not isinstance(first, dict):
        raise ValueError("LLM response choice format is invalid.")
    message = first.get("message")
    if not isinstance(message, dict):
        raise ValueError("LLM response missing 'message'.")
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("LLM response missing 'content'.")
    return content
