from pydantic import BaseModel, Field

from src.domain.enums import DecisionType, IssueType


class SupportCaseInput(BaseModel):
    case_id: str
    title: str
    description: str
    customer_id: str | None = None
    org_id: str | None = None
    severity: str = "medium"
    issue_category_hint: str = ""
    session_id: str | None = None
    thread_id: str | None = None
    metadata: dict[str, str] = Field(default_factory=dict)


class SupportGraphState(BaseModel):
    case_input: SupportCaseInput
    issue_type: IssueType = IssueType.UNKNOWN
    required_tools: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    docs_evidence: list[dict] = Field(default_factory=list)
    tool_evidence: list[dict] = Field(default_factory=list)
    decision: DecisionType = DecisionType.CLARIFY
    decision_rationale: str = ""
    customer_response: str = ""
    internal_note: str = ""
    escalation_artifact_id: str | None = None
