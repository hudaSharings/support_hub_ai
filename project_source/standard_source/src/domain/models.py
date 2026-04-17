from dataclasses import dataclass, field
from typing import Any


@dataclass
class SupportCaseInput:
    case_id: str
    title: str
    description: str
    customer_id: str | None = None
    org_id: str | None = None
    severity: str = "medium"
    metadata: dict[str, str] = field(default_factory=dict)


@dataclass
class ToolResult:
    tool_name: str
    tool_source: str
    success: bool
    findings: dict[str, Any]
    errors: list[str] = field(default_factory=list)
    confidence: float = 0.8


@dataclass
class SupportResolutionOutput:
    issue_type: str
    docs_evidence: list[dict[str, Any]]
    tools_used: list[str]
    important_findings: list[str]
    decision: str
    decision_rationale: str
    customer_response: str
    internal_note: str
    escalation_artifact_id: str | None = None
