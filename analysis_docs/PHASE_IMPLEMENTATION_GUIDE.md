# Phase-Wise Implementation Guide (Code + Tutor Explanations)

This is the implementation learning document to use before actual coding.
It is aligned with:
- `HLD.md` (architecture intent)
- `LLD.md` (module-level design)

This guide is not just instructions. It explains **why** each code snippet exists, what mistakes to avoid, and what to validate.

---

## 0) Consistency Map (Important)

To keep all documents aligned, use these current `beginer_source` module names:

- RAG: `corpus_loader.py`, `chunker.py`, `indexer.py`, `retriever.py`
- Tools:
  - local: `toolkit.py`
  - MCP: `mcp_client.py`, `mcp_tools.py`
- Graph: `support_case_graph.py`
- Workflow wrapper: `workflow/case_resolution.py`
- Runtime interfaces: `app/main.py` (CLI), `app/api.py` (HTTP)
- Ingestion runtime interfaces:
  - CLI: `--ingest-urls-file`
  - API: `POST /ingest`
  - seed file: `src/data/docs_seed_urls.txt`
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
name = "tech-customer-support-ai-beginner"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "chromadb>=0.5.0",
  "fastapi>=0.115.0",
  "langchain-community>=0.3.0",
  "langchain-core>=0.3.0",
  "langgraph>=0.2.0",
  "pydantic>=2.7.0",
  "sentence-transformers>=3.0.0",
  "uvicorn>=0.30.0"
]

[dependency-groups]
dev = ["pytest>=8.0"]
```

### Why this design
- `pydantic` gives safe data contracts.
- `langgraph` is used for multi-agent routing/state.
- `chromadb` + embeddings cover local RAG baseline.

### Snippet: `src/app/config.py`

```python
from dataclasses import dataclass
import os


@dataclass
class Settings:
    llm_provider: str = os.getenv("LLM_PROVIDER", "groq")
    llm_model: str = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    llm_api_base_url: str = os.getenv("LLM_API_BASE_URL", "https://api.groq.com/openai/v1")
    llm_chat_completions_path: str = os.getenv("LLM_CHAT_COMPLETIONS_PATH", "/chat/completions")
    mcp_server_url: str = os.getenv("MCP_SERVER_URL", "")
    docs_store_path: str = os.getenv("DOCS_STORE_PATH", "src/data/docs_corpus.json")
    vector_db_path: str = os.getenv("VECTOR_DB_PATH", "src/data/vector_db")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    scenario_output_dir: str = os.getenv("SCENARIO_OUTPUT_DIR", "docs/scenario_outputs")


settings = Settings()
```

### Snippet: `.env.example` for Groq

```env
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=your_groq_api_key_here
LLM_API_BASE_URL=https://api.groq.com/openai/v1
LLM_CHAT_COMPLETIONS_PATH=/chat/completions
MCP_SERVER_URL=
DOCS_STORE_PATH=src/data/docs_corpus.json
VECTOR_DB_PATH=src/data/vector_db
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
SCENARIO_OUTPUT_DIR=docs/scenario_outputs
```

### Groq API key and model setup (first-time)
1. Go to [https://console.groq.com/](https://console.groq.com/) and sign in.
2. Create an API key in the API Keys section.
3. Put it in `.env` as `GROQ_API_KEY`.
4. Start with `LLM_MODEL=llama-3.1-8b-instant` for faster/cheaper iteration.
5. Upgrade model later only if reasoning quality becomes a bottleneck.

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

### Snippet: `src/domain/models.py`

```python
from pydantic import BaseModel, Field


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

### Snippet: `src/rag/corpus_loader.py` (real fetch + fallback)

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
        text = fetch_and_strip_html(url)  # network path
        if not text.strip():
            text = load_local_fallback(url)  # safe fallback
        docs.append(RawDocument(source_url=url, title=url.split("/")[-1], content=text))
    return docs
```

### Snippet: `src/rag/corpus_loader.py` (ingestion as app feature)

```python
def ingest_urls(urls: list[str], corpus_path: str) -> dict:
    cleaned = [u.strip() for u in urls if u and u.strip()]
    seed_docs = [{"source_url": u, "title": _title_from_url(u), "content": ""} for u in cleaned]
    corpus = _fetch_live_docs(seed_docs)
    path = _resolve_corpus_path(corpus_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(corpus, indent=2))
    return {"written_documents": len(corpus), "corpus_path": str(path)}


def ingest_urls_from_file(urls_file: str, corpus_path: str) -> dict:
    path = Path(urls_file)
    if not path.is_absolute():
        path = Path.cwd() / path
    urls = [line.strip() for line in path.read_text().splitlines() if line.strip() and not line.strip().startswith("#")]
    result = ingest_urls(urls, corpus_path)
    result["source_urls_file"] = str(path)
    return result
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
from langchain_core.documents import Document
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma


def build_vector_index(chunks: list[dict], persist_directory: str, embedding_model: str):
    docs = [
        Document(page_content=c["text"], metadata={"source_url": c["source_url"], "chunk_id": c["chunk_id"]})
        for c in chunks
    ]
    embeddings = SentenceTransformerEmbeddings(model_name=embedding_model)
    return Chroma.from_documents(docs, embedding=embeddings, persist_directory=persist_directory)
```

### Snippet: `src/rag/retriever.py`

```python
def retrieve_evidence(query: str, vector_store, top_k: int = 5) -> list[dict]:
    hits = vector_store.similarity_search_with_relevance_scores(query, k=top_k)
    return [
        {
            "source_url": doc.metadata.get("source_url", "unknown"),
            "chunk_id": doc.metadata.get("chunk_id", "na"),
            "excerpt": doc.page_content,
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
from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    tool_name: str
    tool_source: str
    success: bool
    findings: dict
    errors: list[str] = Field(default_factory=list)
    confidence: float = 0.8
```

### Snippet: `src/tools/local/toolkit.py`

```python
from src.tools.contracts import ToolResult


def get_entitlement_status(org_id: str, feature_name: str) -> ToolResult:
    org_data = _load_store().get("entitlements", {}).get(org_id, {})
    enabled = bool(org_data.get(feature_name, False))
    return ToolResult(
        tool_name="get_entitlement_status",
        tool_source="local",
        success=True,
        findings={"org_id": org_id, "feature_name": feature_name, "enabled": enabled},
        confidence=0.95,
    )
```

### Snippet: `src/tools/mcp/mcp_client.py` (real JSON-RPC call path)

```python
import json
from urllib import request


class MCPClient:
    def __init__(self, server_url: str):
        self.server_url = server_url.rstrip("/")

    def call_tool(self, tool_name: str, payload: dict) -> dict:
        req_body = {
            "jsonrpc": "2.0",
            "id": "1",
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": payload},
        }
        req = request.Request(
            url=self.server_url,
            data=json.dumps(req_body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        return body.get("result", {})
```

### Snippet: `src/tools/mcp/mcp_tools.py`

```python
from src.tools.contracts import ToolResult


def get_service_incidents(client, component: str) -> ToolResult:
    raw = client.call_tool("service_incidents.lookup", {"component": component})
    return ToolResult(
        tool_name="get_service_incidents",
        tool_source="mcp",
        success=True,
        findings=raw,
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

### Snippet: `src/graph/support_case_graph.py`

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph


def _build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("triage", _triage_node)
    graph.add_node("retrieve", _retrieval_node)
    graph.add_node("tools", _tools_node)
    graph.add_node("decide", _decision_node)
    graph.add_node("respond", _response_node)
    graph.add_edge(START, "triage")
    graph.add_edge("triage", "retrieve")
    graph.add_edge("retrieve", "tools")
    graph.add_edge("tools", "decide")
    graph.add_edge("decide", "respond")
    graph.add_edge("respond", END)
    return graph.compile(checkpointer=InMemorySaver())


def run_support_case_graph(case_input: SupportCaseInput, thread_id: str | None = None) -> SupportResolutionOutput:
    initial_state = {"case_input": case_input, ...}
    config = {"configurable": {"thread_id": thread_id}} if thread_id else None
    final_state = SUPPORT_CASE_GRAPH.invoke(initial_state, config=config)
    return map_to_output(final_state)
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

### Snippet: `src/workflow/case_resolution.py` (thread resolution + graph invoke)

```python
def resolve_case(case_input: SupportCaseInput) -> SupportResolutionOutput:
    thread_id = case_input.thread_id or case_input.session_id or case_input.case_id
    return run_support_case_graph(case_input, thread_id=thread_id)
```

### Snippet: `src/app/main.py` (CLI ingestion command)

```python
from src.app.config import settings
from src.rag.corpus_loader import ingest_urls_from_file

...
parser.add_argument("--ingest-urls-file", type=str, default="")
...
if args.ingest_urls_file:
    summary = ingest_urls_from_file(args.ingest_urls_file, settings.docs_store_path)
    print(json.dumps(summary, indent=2))
    return
```

### Snippet: `src/app/api.py` (`POST /ingest` endpoint)

```python
from pydantic import BaseModel, Field
from src.app.config import settings
from src.rag.corpus_loader import ingest_urls


class IngestRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)


@app.post("/ingest")
def ingest(payload: IngestRequest) -> dict:
    if not payload.urls:
        raise HTTPException(status_code=400, detail="urls must not be empty.")
    return ingest_urls(payload.urls, settings.docs_store_path)
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


def run_all_scenarios(fixtures_dir="src/scenarios/fixtures"):
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for file_path in Path(fixture_dir).glob("scenario_*.json"):
        payload = json.loads(file_path.read_text())
        case = SupportCaseInput(**payload)
        result = resolve_case(case)
        (Path(out_dir) / f"{file_path.stem}_output.json").write_text(
            json.dumps(result.model_dump(mode="json"), indent=2)
        )
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
python3 -m src.app.main --ingest-urls-file src/data/docs_seed_urls.txt
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
from src.domain.models import SupportCaseInput


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
from src.domain.models import SupportGraphState
from src.domain.enums import DecisionType
from src.agents.decision_agent import decide


def test_decision_clarify_when_missing_information():
    state = SupportGraphState(case_input=..., missing_information=["org_id"], tool_evidence=[])
    out = decide(state)
    assert out.decision == DecisionType.CLARIFY
```

---

## Final Tutor Checklist (Before Coding Begins)

- You can explain difference between docs evidence and tool evidence.
- You can explain why at least one tool must run via MCP.
- You understand that `clarify` is safer than guessing.
- You can trace one scenario end-to-end from input to final output JSON.

If all yes, implementation can begin phase-by-phase.
