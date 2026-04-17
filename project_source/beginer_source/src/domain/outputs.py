from typing import Any

from pydantic import BaseModel, Field

from src.domain.enums import DecisionType


class SupportResolutionOutput(BaseModel):
    issue_type: str
    docs_evidence: list[dict[str, Any]]
    tools_used: list[str]
    important_findings: list[str]
    decision: DecisionType
    decision_rationale: str
    customer_response: str
    internal_note: str
    escalation_artifact_id: str | None = None
    metadata: dict[str, str] = Field(default_factory=dict)
