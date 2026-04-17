from typing import Any

from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    tool_name: str
    tool_source: str
    success: bool
    findings: dict[str, Any]
    errors: list[str] = Field(default_factory=list)
    confidence: float = 0.8
