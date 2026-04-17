# Standard Phase Implementation Guide (DB-First, Tutor Edition)

This version is intentionally detailed to match the depth of the original phase guide while keeping a production-style architecture.

How to use this guide:
- Each phase has **Intent**, **Implementation**, **Code**, **Quality Gate**, and **Common Mistakes**.
- Build in order. Do not skip phase gates.
- Keep everything typed and testable.

---

## Phase 0 - Foundation and Runtime Setup

### Intent
Create a reproducible developer environment with config isolation and safe defaults.

### Implementation Scope
- initialize project with `uv`
- define runtime/dev dependencies
- centralize environment config
- verify baseline test command

### Code Snippet: `pyproject.toml`
```toml
[project]
name = "tech-customer-support-ai"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "pydantic>=2.7",
  "pydantic-settings>=2.2",
  "sqlmodel>=0.0.22",
  "sqlalchemy>=2.0",
  "alembic>=1.13",
  "langchain>=0.2",
  "langgraph>=0.2",
  "chromadb>=0.5",
  "sentence-transformers>=3.0",
  "fastapi>=0.111",
  "uvicorn>=0.30"
]

[dependency-groups]
dev = ["pytest>=8.0", "ruff>=0.5"]
```

### Code Snippet: `.env.example`
```env
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=your_key
VECTOR_DB_PATH=src/data/vector_db
SQLITE_URL=sqlite:///./src/data/app.db
MCP_SERVER_URL=
LOG_LEVEL=INFO
```

### Code Snippet: `src/app/config.py`
```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_provider: str = "groq"
    llm_model: str = "llama-3.1-8b-instant"
    groq_api_key: str | None = None
    vector_db_path: str = "src/data/vector_db"
    sqlite_url: str = "sqlite:///./src/data/app.db"
    mcp_server_url: str | None = None
    log_level: str = "INFO"
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
```

### Quality Gate
- App can import `settings` with no runtime exceptions.
- `uv run pytest` runs successfully.
- No secret values committed.

### Common Mistakes
- Hardcoding API keys in code.
- Scattering env reads across files instead of using one config object.

---

## Phase 1 - Domain Models + Persistence Models

### Intent
Separate business meaning from storage structure.

### Implementation Scope
- create domain models (Pydantic)
- create DB models (SQLModel/ORM)
- keep mapping explicit
- prepare migrations

### Code Snippet: domain vs table split
```python
# src/domain/support_case.py
from pydantic import BaseModel, Field


class SupportCaseInput(BaseModel):
    case_id: str
    customer_id: str | None = None
    org_id: str | None = None
    title: str
    description: str = Field(min_length=10)
    severity: str = "medium"
```

```python
# src/persistence/models.py
from sqlmodel import SQLModel, Field


class SupportCaseTable(SQLModel, table=True):
    case_id: str = Field(primary_key=True)
    customer_id: str | None = None
    org_id: str | None = None
    title: str
    description: str
    severity: str = "medium"
```

### Quality Gate
- Domain and table models both validate.
- Initial migration can be generated and applied.

### Common Mistakes
- Using DB models directly inside graph nodes.
- Keeping domain and table fields inconsistent.

---

## Phase 2 - Repository Layer

### Intent
Keep agents/services independent from storage technology.

### Implementation Scope
- define repository interfaces
- implement SQL repositories
- wire repositories into services

### Code Snippet: repository protocol
```python
from typing import Protocol


class CaseRepository(Protocol):
    def get_case(self, case_id: str) -> dict | None: ...
    def save_case(self, payload: dict) -> None: ...
    def list_case_history(self, case_id: str) -> list[dict]: ...
```

### Code Snippet: SQL implementation sketch
```python
class SqlCaseRepository:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def get_case(self, case_id: str) -> dict | None:
        with self.session_factory() as s:
            row = s.get(SupportCaseTable, case_id)
            return row.model_dump() if row else None
```

### Quality Gate
- Repository unit tests pass with seeded DB.
- Service layer uses repository interfaces only.

### Common Mistakes
- Business logic inside repository methods.
- Returning ORM objects directly to upper layers.

---

## Phase 3 - RAG Pipeline

### Intent
Provide grounded documentation evidence with citation safety.

### Implementation Scope
- ingest docs from seed URLs
- normalize content
- chunk with metadata
- index embeddings in vector DB
- retrieve evidence with scores

### Code Snippet: chunk contract
```python
def make_chunk(source_url: str, chunk_id: str, text: str, title: str | None = None) -> dict:
    return {
        "text": text,
        "metadata": {
            "source_url": source_url,
            "chunk_id": chunk_id,
            "title": title or "",
        },
    }
```

### Code Snippet: retrieval result shaping
```python
def to_evidence(doc, score: float) -> dict:
    return {
        "source_url": doc.metadata["source_url"],
        "chunk_id": doc.metadata["chunk_id"],
        "excerpt": doc.page_content[:400],
        "relevance_score": float(score),
    }
```

### Quality Gate
- Retrieval returns relevant chunks for test queries.
- Every chunk includes `source_url` + `chunk_id`.
- Non-clarify decisions can cite at least one chunk.

### Common Mistakes
- Missing metadata fields.
- Oversized chunks reducing precision.

---

## Phase 4 - Tool Layer (Local + MCP)

### Intent
Combine deterministic account checks with protocol-based tool interoperability.

### Implementation Scope
- define `ToolResult` contract
- implement local tools backed by repositories
- implement MCP adapter for at least one required capability
- add safe fallback behavior

### Code Snippet: tool contract
```python
from pydantic import BaseModel


class ToolResult(BaseModel):
    tool_name: str
    success: bool
    findings: dict
    errors: list[str] = []
    confidence: float = 0.8
    tool_source: str = "local"
```

### Code Snippet: MCP wrapper
```python
def get_service_incidents(client, component: str) -> ToolResult:
    try:
        raw = client.call_tool("service_incidents.lookup", {"component": component})
        return ToolResult(
            tool_name="get_service_incidents",
            success=True,
            findings=raw,
            confidence=0.85,
            tool_source="mcp",
        )
    except Exception as ex:
        return ToolResult(
            tool_name="get_service_incidents",
            success=False,
            findings={},
            errors=[str(ex)],
            confidence=0.0,
            tool_source="mcp",
        )
```

### Quality Gate
- At least one scenario executes MCP-backed tool successfully.
- Failures produce safe structured errors, not crashes.

### Common Mistakes
- Inconsistent tool payload shapes.
- No distinction between local and MCP evidence.

---

## Phase 5 - LangGraph Orchestration

### Intent
Encode repeatable support resolution flow with explicit state.

### Implementation Scope
- define typed graph state
- implement nodes: triage/retrieve/tools/decision/response
- wire edges and error routing

### Code Snippet: state skeleton
```python
class SupportGraphState(TypedDict, total=False):
    case_input: dict
    suspected_category: str
    required_tools: list[str]
    doc_evidence: list[dict]
    tool_evidence: list[dict]
    missing_information: list[str]
    decision: str
    decision_rationale: str
    customer_response: str
    internal_note: str
    escalation_artifact_id: str | None
    trace_id: str
```

### Quality Gate
- End-to-end run returns complete state for baseline scenario.
- Node updates are partial and merge cleanly.

### Common Mistakes
- Putting all logic into one node.
- Hidden mutable globals causing nondeterministic behavior.

---

## Phase 6 - Decision and Response Policy

### Intent
Ensure safe, auditable decisions (`resolve`, `clarify`, `escalate`).

### Implementation Scope
- deterministic rubric first
- LLM for wording/rationale enhancement
- enforce no unsupported assumptions
- produce customer/internal dual responses

### Code Snippet: policy-first decision
```python
def choose_decision(missing: list[str], repeated_unresolved: bool, has_actionable_evidence: bool) -> str:
    if missing:
        return "clarify"
    if repeated_unresolved:
        return "escalate"
    if has_actionable_evidence:
        return "resolve"
    return "clarify"
```

### Quality Gate
- Decision branch tests pass for all three outcomes.
- `clarify` requests precise missing fields.
- `escalate` includes rationale + artifact id.

### Common Mistakes
- Letting LLM override hard safety logic.
- Using generic clarify messages without targeted asks.

---

## Phase 7 - API/CLI Contracts

### Intent
Provide consistent system entrypoints for support analysts and automation.

### Implementation Scope
- implement `POST /cases/resolve`
- optional `GET /cases/{case_id}`
- strict request/response schema validation
- error translation to API-safe responses

### Code Snippet: route contract sketch
```python
@router.post("/cases/resolve", response_model=SupportResolutionOutput)
def resolve_case(payload: SupportCaseInput):
    return orchestrator.run(payload.model_dump())
```

### Quality Gate
- Contract tests validate both valid and invalid payload paths.
- Response schema matches `SupportResolutionOutput`.

### Common Mistakes
- Returning ad-hoc dicts that drift from schema.
- Exposing raw internal exceptions in API response.

---

## Phase 8 - Scenario Validation and Packaging

### Intent
Prove full kata compliance with reproducible evidence.

### Implementation Scope
- run all 8 required scenario fixtures
- validate output schema and completeness
- generate scenario output artifacts and summary report
- finalize README and limitation notes

### Code Snippet: artifact write pattern
```python
def write_scenario_output(scenario_id: str, payload: dict, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{scenario_id}_output.json").write_text(json.dumps(payload, indent=2))
```

### Quality Gate
- 8/8 scenarios pass validation.
- Outputs include docs citations and tool findings.
- At least one scenario logs MCP execution path.

### Common Mistakes
- Manual one-off scenario runs without persisted outputs.
- Missing internal note or missing evidence section.

---

## Mandatory Phase Gates (Summary)
- Phase 0: environment + config load pass.
- Phase 1: migrations apply cleanly; model validation passes.
- Phase 2: repository tests pass.
- Phase 3: retriever returns citation-ready evidence.
- Phase 4: MCP path runs in at least one scenario.
- Phase 5: graph produces complete output state.
- Phase 6: resolve/clarify/escalate decision tests pass.
- Phase 7: API contract tests pass.
- Phase 8: all 8 scenario artifacts generated and valid.

---

## Non-Happy Path Checks
- Missing identifiers -> `clarify` with targeted fields.
- Tool timeout -> warning + fallback where safe.
- Retrieval empty -> `clarify`; never fabricate docs evidence.
- Repeated unresolved + high impact -> `escalate`.
- Evidence conflict (docs vs tool) -> mark conflict in rationale and avoid forced resolve.

---

## Required Artifacts by End
- `docs/scenario_outputs/scenario_1_output.json` through `scenario_8_output.json`
- `docs/scenario_outputs/summary_report.md`
- README with setup, ingestion, run, and troubleshooting
- limitations and next-improvement note
