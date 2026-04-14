# Phase-Wise Implementation Guide (Code + Tutor Explanations)

This is the implementation learning document to use before actual coding.
It is aligned with:
- `HLD.md` (architecture intent)
- `LLD.md` (module-level design)

This guide is not just instructions. It explains **why** each code snippet exists, what mistakes to avoid, and what to validate.

---

## 0) Consistency Map (Important)

To keep all documents aligned, we use these module names from `LLD.md`:

- RAG: `corpus_loader.py`, `normalizer.py`, `chunker.py`, `indexer.py`, `retriever.py`
- Tools:
  - local: `customer_context.py`, `subscription_lookup.py`, `entitlement_check.py`, `token_diagnostics.py`, `case_history_lookup.py`, `service_status_lookup.py`, `escalation_artifact.py`
  - MCP: `mcp_client.py`, `mcp_tool_registry.py`, `mcp_wrapped_tools.py`
- Graph: `state.py`, `nodes.py`, `edges.py`, `workflow.py`
- Scenarios: `fixtures/`, `run_scenarios.py`

If code examples differ from this naming, always follow this map.

---

## Phase 0 - Bootstrap and Configuration

### What we build
- project dependencies
- environment-based configuration
- repeatable setup

### Tutor note
Beginners often start writing logic too early. Resist that.
If setup is unstable, every later phase feels broken even when code is correct.

### Snippet: `pyproject.toml`

```toml
[project]
name = "cca-support-ai"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "pydantic>=2.7",
  "pydantic-settings>=2.2",
  "langchain>=0.2",
  "langgraph>=0.2",
  "chromadb>=0.5",
  "sentence-transformers>=3.0",
]

[dependency-groups]
dev = ["pytest>=8.0", "ruff>=0.5"]
```

### Why this design
- `pydantic` gives safe data contracts.
- `langgraph` is used for multi-agent routing/state.
- `chromadb` + embeddings cover local RAG baseline.

### Snippet: `src/app/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_provider: str = "groq"
    llm_model: str = "llama-3.1-8b-instant"
    groq_api_key: str | None = None
    vector_db_path: str = "src/data/vector_db"
    mcp_server_url: str | None = None
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
```

### Tutor note
Keep config in one place from day one.
Do not read env vars directly inside tool/agent files.

### Phase gate
- Can run a simple script importing `settings` without error.
- No secret values committed.

---

## Phase 1 - Domain Modeling (Typed Contracts)

### What we build
- enums and models for all core I/O
- support case input schema
- final resolution output schema

### Tutor note
In agent systems, untyped `dict` data spreads quickly and causes debugging pain.
Strong models are your safety rails.

### Snippet: `src/domain/enums.py`

```python
from enum import Enum


class DecisionType(str, Enum):
    RESOLVE = "resolve"
    CLARIFY = "clarify"
    ESCALATE = "escalate"


class IssueCategory(str, Enum):
    BILLING = "billing"
    ENTITLEMENT = "entitlement"
    TOKEN_AUTH = "token_auth"
    REST_API = "rest_api"
    SAML_IDENTITY = "saml_identity"
    UNKNOWN = "unknown"
```

### Snippet: `src/domain/support_case.py`

```python
from pydantic import BaseModel, Field


class SupportCaseInput(BaseModel):
    case_id: str
    customer_id: str | None = None
    org_id: str | None = None
    title: str
    description: str = Field(min_length=10)
    severity: str = "medium"
    metadata: dict[str, str] = {}
```

### Snippet: `src/domain/outputs.py`

```python
from pydantic import BaseModel
from .enums import DecisionType


class RetrievedDocEvidence(BaseModel):
    source_url: str
    chunk_id: str
    excerpt: str
    relevance_score: float


class SupportResolutionOutput(BaseModel):
    issue_type: str
    docs_evidence: list[RetrievedDocEvidence]
    tools_used: list[str]
    important_findings: list[str]
    decision: DecisionType
    decision_rationale: str
    customer_response: str
    internal_note: str
    escalation_artifact_id: str | None = None
```

### Common mistake
Using free-form strings for decision instead of enum values.

### Phase gate
- Input and output models validate correctly in tests.

---

## Phase 2 - RAG Pipeline (Loader -> Chunk -> Index -> Retrieve)

### What we build
- corpus loader from kata seed URLs
- normalizer and chunking with source metadata
- vector indexer and retriever

### Tutor note
RAG quality determines support quality.
If retrieval is weak, the best prompt in the world cannot fix it.

### Snippet: `src/rag/corpus_loader.py`

```python
from dataclasses import dataclass


@dataclass
class RawDocument:
    source_url: str
    title: str
    content: str


def load_seed_documents(seed_urls: list[str]) -> list[RawDocument]:
    docs: list[RawDocument] = []
    for url in seed_urls:
        # Replace with real fetch + parse in implementation
        docs.append(RawDocument(source_url=url, title=url.split("/")[-1], content="..."))
    return docs
```

### Snippet: `src/rag/chunker.py`

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_document(content: str, source_url: str) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120)
    chunks = splitter.split_text(content)
    return [
        {
            "chunk_id": f"{source_url}::chunk::{idx}",
            "text": text,
            "metadata": {"source_url": source_url, "chunk_id": f"{source_url}::chunk::{idx}"},
        }
        for idx, text in enumerate(chunks)
    ]
```

### Snippet: `src/rag/indexer.py`

```python
def index_chunks(vector_store, chunks: list[dict]) -> None:
    texts = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]
    vector_store.add_texts(texts=texts, metadatas=metadatas)
```

### Snippet: `src/rag/retriever.py`

```python
def retrieve_evidence(query: str, vector_store, top_k: int = 5) -> list[dict]:
    hits = vector_store.similarity_search_with_score(query, k=top_k)
    return [
        {
            "source_url": doc.metadata.get("source_url", "unknown"),
            "chunk_id": doc.metadata.get("chunk_id", "na"),
            "excerpt": doc.page_content[:400],
            "relevance_score": float(score),
        }
        for doc, score in hits
    ]
```

### Common mistake
Forgetting `source_url` in metadata. Then you cannot prove evidence in final output.

### Phase gate
- Sample query returns citation-ready chunks.

---

## Phase 3 - Tool Layer (Local + MCP)

### What we build
- stable tool contract
- local tools for case-specific checks
- MCP wrapper for at least one tool path

### Tutor note
Docs explain product behavior.
Tools explain **this customer’s state**.
Support decisions require both.

### Snippet: `src/tools/contracts.py`

```python
from pydantic import BaseModel


class ToolResult(BaseModel):
    tool_name: str
    success: bool
    findings: dict
    errors: list[str] = []
    confidence: float = 0.8
```

### Snippet: `src/tools/local/entitlement_check.py`

```python
from src.tools.contracts import ToolResult


def get_entitlement_status(org_id: str, feature_name: str, entitlements: dict) -> ToolResult:
    org_data = entitlements.get(org_id, {})
    enabled = bool(org_data.get(feature_name, False))
    return ToolResult(
        tool_name="get_entitlement_status",
        success=True,
        findings={"org_id": org_id, "feature_name": feature_name, "enabled": enabled},
        confidence=0.95,
    )
```

### Snippet: `src/tools/mcp/mcp_client.py`

```python
class MCPClient:
    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def call_tool(self, tool_name: str, payload: dict) -> dict:
        # Replace with real MCP protocol client call
        return {"tool_name": tool_name, "payload": payload, "incidents": []}
```

### Snippet: `src/tools/mcp/mcp_wrapped_tools.py`

```python
from src.tools.contracts import ToolResult


def get_service_incidents(client, component: str) -> ToolResult:
    raw = client.call_tool("service_incidents.lookup", {"component": component})
    return ToolResult(
        tool_name="get_service_incidents",
        success=True,
        findings={"component": component, "incidents": raw.get("incidents", [])},
        confidence=0.85,
    )
```

### Phase gate
- At least one execution path uses MCP-backed tool call.

---

## Phase 4 - Multi-Agent Workflow with LangGraph

### What we build
- graph state object
- node functions
- workflow routing

### Tutor note
Think of the graph as your support playbook:
every node is a repeatable step, not a random prompt chain.

### Snippet: `src/graph/state.py`

```python
from typing import TypedDict


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
```

### Snippet: `src/graph/nodes.py`

```python
def triage_node(state: dict) -> dict:
    text = f"{state['case_input']['title']} {state['case_input']['description']}".lower()
    if "saml" in text:
        return {"suspected_category": "saml_identity", "required_tools": ["service_status", "case_history"]}
    if "token" in text:
        return {"suspected_category": "token_auth", "required_tools": ["token_diagnostics", "case_history"]}
    if "billing" in text or "plan" in text:
        return {"suspected_category": "billing", "required_tools": ["subscription_lookup", "entitlement_check"]}
    return {"suspected_category": "unknown", "required_tools": ["customer_context"]}


def decision_node(state: dict) -> dict:
    if state.get("missing_information"):
        return {"decision": "clarify", "decision_rationale": "Missing critical fields to proceed."}
    repeated = any("repeated unresolved" in str(x).lower() for x in state.get("tool_evidence", []))
    if repeated:
        return {"decision": "escalate", "decision_rationale": "Repeated unresolved case history detected."}
    return {"decision": "resolve", "decision_rationale": "Evidence supports actionable resolution."}
```

### Snippet: `src/graph/workflow.py`

```python
from langgraph.graph import StateGraph, END
from .state import SupportGraphState
from .nodes import triage_node, decision_node


def build_graph():
    graph = StateGraph(SupportGraphState)
    graph.add_node("triage", triage_node)
    graph.add_node("decision", decision_node)
    graph.set_entry_point("triage")
    graph.add_edge("triage", "decision")
    graph.add_edge("decision", END)
    return graph.compile()
```

### Common mistake
Starting with too many nodes at once. Build minimal flow first, then add retrieve/tool/response nodes.

### Phase gate
- A sample case runs from `triage` to final `decision`.

---

## Phase 5 - Response Generation and Guardrails

### What we build
- customer-safe language
- internal actionable note
- clarify/escalate behavior clarity

### Tutor note
Customer response and internal note serve different audiences.
Do not copy-paste the same text for both.

### Snippet: `src/agents/response_agent.py`

```python
def build_customer_response(state: dict) -> str:
    decision = state["decision"]
    if decision == "clarify":
        return (
            "To help us continue, please share your org name, exact failing action, "
            "timestamp, and full error message."
        )
    if decision == "escalate":
        return "We have escalated this issue to a specialist team and will follow up with updates."
    return "We identified the likely cause and attached clear next steps to resolve your issue."


def build_internal_note(state: dict) -> str:
    return (
        f"Issue={state.get('suspected_category')} | "
        f"Decision={state.get('decision')} | "
        f"Rationale={state.get('decision_rationale')}"
    )
```

### Phase gate
- Clarify output asks precise missing info.
- Escalate output states clear escalation reason internally.

---

## Phase 6 - Scenario Execution (All 8 Required)

### What we build
- fixture-based runs
- output artifacts per scenario
- schema validation

### Snippet: `src/scenarios/run_scenarios.py`

```python
import json
from pathlib import Path


def run_all(graph, fixture_dir="src/scenarios/fixtures", out_dir="docs/scenario_outputs"):
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for file_path in Path(fixture_dir).glob("scenario_*.json"):
        case_input = json.loads(file_path.read_text())
        result = graph.invoke({"case_input": case_input})
        (Path(out_dir) / f"{file_path.stem}_output.json").write_text(json.dumps(result, indent=2))
```

### Snippet: `src/evaluation/validators.py`

```python
def validate_result(result: dict) -> None:
    required = ["decision", "decision_rationale", "customer_response", "internal_note"]
    missing = [k for k in required if not result.get(k)]
    if missing:
        raise ValueError(f"Missing required output fields: {missing}")
```

### Tutor note
Use fixtures always. If you only test manually, regressions will surprise you later.

### Phase gate
- All 8 scenarios produce valid output artifacts.

---

## Phase 7 - Submission Packaging

### What we build
- reproducible README
- ingestion/run instructions
- limitations + improvements section

### Snippet: README run commands

```bash
uv sync
cp .env.example .env
uv run python -m src.rag.corpus_loader
uv run python -m src.scenarios.run_scenarios
uv run pytest
```

### Tutor note
Evaluator should be able to run your project without asking you any questions.
If something is not in README, it effectively does not exist.

### Phase gate
- Fresh setup on clean environment succeeds.

---

## Minimal Tests to Start With

### Snippet: `tests/test_domain_models.py`

```python
from src.domain.support_case import SupportCaseInput


def test_support_case_valid():
    model = SupportCaseInput(
        case_id="C-101",
        title="PAT fails on org API",
        description="Token works for user resources but fails for org resources.",
    )
    assert model.case_id == "C-101"
```

### Snippet: `tests/test_decision_logic.py`

```python
from src.graph.nodes import decision_node


def test_decision_clarify_when_missing_information():
    state = {"missing_information": ["org_id"], "tool_evidence": []}
    out = decision_node(state)
    assert out["decision"] == "clarify"
```

---

## Final Tutor Checklist (Before Coding Begins)

- You can explain difference between docs evidence and tool evidence.
- You can explain why at least one tool must run via MCP.
- You understand that `clarify` is safer than guessing.
- You can trace one scenario end-to-end from input to final output JSON.

If all yes, implementation can begin phase-by-phase.
