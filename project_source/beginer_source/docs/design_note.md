# Design Note

## Architecture
- Execution path:
  - Entry points: CLI (`src/app/main.py`) and API (`src/app/api.py`)
  - Pipeline wrapper: `src/workflow/case_resolution.py` (thread id resolution and graph invocation)
  - LangGraph runner: `src/graph/support_case_graph.py`
- Multi-agent LangGraph node sequence:
  1. Triage agent
  2. Retrieval agent (RAG)
  3. Tooling executor (registry-driven local + MCP execution)
  4. Decision agent
  5. Response agent
- Data and retrieval foundations:
  - Pydantic models are used for input/output/tool contracts.
  - Chroma + sentence-transformer embeddings are used for semantic retrieval.
- Session handling:
  - LangGraph checkpointer uses `InMemorySaver` in graph compile.
  - Graph invocation passes `config={"configurable": {"thread_id": "<id>"}}`.
  - Thread id resolution order is `thread_id` -> `session_id` -> `case_id`.
  - Memory is in-process only and resets on app restart.

## Why this design
- Docs-only reasoning is insufficient for support resolution.
- Case-specific checks are represented through tools.
- Tool execution is centralized through `src/agents/tooling/registry.py` and `src/agents/tooling/executor.py`.
- MCP calls are routed via `src/tools/mcp/router.py` (internal tool name -> MCP method mapping).
- Router performs capability checks through `tools/list` when supported by server, and falls back safely.
- MCP-backed incident lookup keeps local fallback for resilience.

## Outcome policy
- `clarify` when critical identifiers are missing.
- `escalate` when repeated unresolved risk appears.
- `resolve` when evidence supports actionable guidance.
