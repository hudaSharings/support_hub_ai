# Technical Customer Support Resolution System - Guided Project Plan

## 1) Goal and Mentoring Style

This project builds a beginner-friendly but production-minded multi-agent support system for GitHub.com support cases.

Teaching style for the learner:
- Learn by doing in small steps.
- Build one working slice at a time.
- Keep code modular and testable from day one.
- Prefer simple, explicit design over clever complexity.

Primary outcomes:
- Understand basics of Python project structure.
- Understand RAG, tools, agents, and MCP through implementation.
- Deliver all kata-required scenarios and outputs with traceable evidence.

---

## 2) Requirement Coverage Checklist (from `Final_kata.md`)

This plan explicitly covers all mandatory requirements:
- Multi-agent support workflow.
- RAG over GitHub Docs corpus.
- Tool use for business/case context.
- MCP-based integration for part of tools.
- Support all required scenario types.
- Support all outcomes: `resolve`, `clarify`, `escalate`.
- Evidence for conclusions.
- Customer-facing response and internal support note.
- Deliverables: source, setup, README, design note, ingestion steps, scenario runs, outputs, limitations.

---

## 3) Recommended Tech Stack (Beginner + Scalable)

## Core
- Python `3.11+`
- `uv` for dependency and environment management
- `pydantic` for strongly typed models
- `fastapi` (optional but recommended) for future API layer
- `pytest` for testing

## Agent Orchestration
- `langgraph` for workflow/stateful multi-agent orchestration
- `langchain` for prompt/tool abstractions and retriever integrations

## RAG
- Embeddings: `sentence-transformers` (local and free) OR provider embeddings if available
- Vector store: `chroma` (simple local), then swappable later
- Text splitting and metadata tracking with LangChain utilities

## LLM Provider
- Groq is acceptable for low-cost/free-tier experimentation.
- Alternative providers can be configured via env vars.
- Keep provider behind a small adapter so switching is easy.

## MCP
- Use one or more tools through MCP server interface (example: account lookup or incident lookup tool).
- Keep MCP tools in a separate `tools/mcp/` module from local tools.

---

## 4) Why LangChain + LangGraph Here

For this kata, yes, use LangChain/LangGraph.

Reason:
- LangChain helps with RAG pipeline primitives quickly.
- LangGraph gives reliable agent workflow and explicit state transitions.
- Easier to enforce the three outcomes (`resolve`, `clarify`, `escalate`) with graph routing.
- Better for observability than ad-hoc loops.

Risk and mitigation:
- Risk: too much abstraction for beginner.
- Mitigation: start with minimal graph (3-4 nodes), then incrementally add behavior.

---

## 5) High-Level Architecture

Input: support case (title, description, optional IDs)

Pipeline:
1. Intake/triage agent classifies issue area and required evidence.
2. Retriever agent gathers doc evidence (RAG).
3. Tool agent fetches case-specific data (billing, org, entitlement, token, incidents, history).
4. Decision agent selects one outcome:
   - `resolve`
   - `clarify`
   - `escalate`
5. Response agent generates:
   - customer-facing response
   - internal support note
   - machine-readable evidence summary

Output object (structured JSON + formatted text):
- issue_type
- retrieved_evidence (with source URLs/chunk IDs)
- tools_used + tool outputs
- findings
- decision (`resolve|clarify|escalate`)
- customer_response
- internal_note

---

## 6) Project Structure (Scalable and Decoupled)

```text
cca_support_ai/
  pyproject.toml
  README.md
  .env.example
  src/
    app/
      main.py                       # optional FastAPI/CLI entry
      config.py
      bootstrap.py
    domain/
      entities.py                   # business entities (Pydantic)
      support_case.py               # support case input model
      outputs.py                    # final response/output schema
      enums.py
    rag/
      corpus_loader.py              # load docs from seed URLs
      normalizer.py                 # normalize html/text/markdown
      chunker.py
      indexer.py                    # embedding + vector DB writes
      retriever.py
    tools/
      contracts.py
      local/
        toolkit.py
      mcp/
        mcp_client.py               # MCP client setup
        mcp_tools.py                # wrapped MCP tool calls
    agents/
      prompts/
        triage_prompt.txt
        retrieval_prompt.txt
        decision_prompt.txt
        response_prompt.txt
      triage_agent.py
      retrieval_agent.py
      tool_agent.py
      decision_agent.py
      response_agent.py
    graph/
      support_case_graph.py         # LangGraph definition
    workflow/
      case_resolution.py            # app-level graph invocation wrapper
    scenarios/
      fixtures/
        scenario_1.json
        ...
        scenario_8.json
      run_scenarios.py
    evaluation/
      validators.py
      report_writer.py
    data/
      raw_docs/
      processed_docs/
      vector_db/
      mock_business_data/
    tests/
      test_domain_models.py
      test_tools.py
      test_rag.py
      test_graph_workflow.py
      test_decision_logic.py
      test_scenarios.py
  docs/
    design_note.md
    ingest_guide.md
    scenario_outputs/
```

Design principles:
- `domain` has zero dependency on LangChain/LangGraph.
- Agent logic separate from tool implementations.
- Provider-specific LLM config isolated in config/adapter.
- Data layer and orchestration are swappable.

---

## 7) Beginner Prerequisites and Learning Path

Before coding project logic, learner should know:
- Python basics: functions, classes, typing, exceptions.
- Virtual environments and `uv`.
- JSON and simple file IO.
- Basic HTTP concepts and API auth.

Minimal concept briefing (must be taught first):
1. LLM: language model that reasons over text.
2. Prompt: structured instruction to guide model behavior.
3. RAG: retrieve trusted documents, then generate grounded answer.
4. Tool use: model calls deterministic functions for case-specific facts.
5. Agent: role-focused decision component with memory/state.
6. MCP: standard protocol to expose tools in a reusable way.

---

## 8) Implementation Phases (Teaching by Doing)

## Phase 0 - Setup and Baseline
Deliverables:
- `uv` project initialized.
- folder structure scaffolded.
- lint/test tooling configured.
- `.env.example` created.

Acceptance:
- `uv run pytest` executes (even with placeholder tests).

## Phase 1 - Domain Modeling
Implement all business entities from kata as Pydantic models.
Add lightweight repository layer with mock JSON seed data.

Acceptance:
- Entity validation tests pass.
- Sample case object can be parsed and printed.

## Phase 2 - Corpus Ingestion + RAG Baseline
Steps:
- Load provided GitHub Docs URLs.
- Normalize to markdown/text.
- Chunk with metadata (url/title/section).
- Build vector index.
- Implement retriever function (`top_k` configurable).
- Ensure chunk metadata includes `source_url` and `chunk_id` for citation-safe output.

Acceptance:
- For a sample query, retriever returns relevant chunks with source URLs.

## Phase 3 - Tool Layer (Local + MCP)
Local tools implement required capability checks:
- customer/org context
- plan/subscription
- entitlements
- token/auth state
- case history
- service/incident status
- escalation artifact creation

Then implement at least one capability through MCP-backed tool call (for kata compliance), while keeping local fallback adapters.

Acceptance:
- Tool contract tests pass.
- MCP tool callable from workflow.

## Phase 4 - Multi-Agent Workflow (LangGraph)
Build graph with nodes:
- `triage_node`
- `retrieve_node`
- `tool_node`
- `decision_node`
- `response_node`

State fields:
- case input
- suspected category
- retrieved evidence
- tool findings
- confidence / missing info
- final decision
- final outputs

Acceptance:
- Graph runs end-to-end on one scenario and returns structured output.
- Graph state is explicit and merged via partial node updates.

## Phase 5 - Decision Policy and Guardrails
Add explicit decision rubric:
- `resolve` only when evidence is sufficient and contradiction-free.
- `clarify` when missing key fields/uncertain signals.
- `escalate` for repeated failures, policy locks, severe SSO/enterprise blockers, or unresolved history.

Acceptance:
- Rule tests for decision branches.

## Phase 6 - Scenario Coverage (All 8 Required)
Create 8 scenario fixtures and expected path checks.
Run evaluator to produce output artifacts.

Acceptance:
- All 8 scenarios produce outputs with:
  - issue type
  - docs evidence
  - tools used
  - findings
  - outcome
  - customer response
  - internal note

## Phase 7 - Documentation and Packaging
Prepare:
- README
- setup instructions
- ingest guide
- design note
- scenario run instructions
- limitation and next-step summary

Acceptance:
- Fresh clone setup works from README only.

---

## 9) Prompting Strategy (Simple and Reliable)

Prompt design:
- Use role-specific prompts per agent.
- Enforce JSON output schemas.
- Require citation of source URLs from retriever metadata.
- Prohibit unsupported assumptions.

Guardrails:
- If evidence missing -> `clarify`.
- If customer impact high + repeated unresolved history -> consider `escalate`.
- Always separate:
  - documentation-backed facts
  - case/tool-backed facts

---

## 10) Testing Strategy

Test layers:
- Unit: entities, parsers, tools.
- Integration: retriever + LLM output parser + graph transitions.
- Scenario/e2e: 8 required scenarios.

Quality checks:
- Deterministic fixtures for tool responses.
- Snapshot test for final structured output schema.
- Basic hallucination check: ensure every doc claim cites retrieved source.

---

## 11) Observability and Reliability

Add from early stage:
- Structured logs for each graph node.
- Trace ID per support case.
- Persist intermediate evidence for audit.
- Timeouts/retries for model and tool calls.
- Fail-safe fallback to `clarify` when uncertainty is high.

---

## 12) Security and Production Hygiene

- No secrets in code or git.
- `.env` for API keys (`GROQ_API_KEY`, etc.).
- Mask tokens and sensitive fields in logs.
- Validate tool inputs with Pydantic schemas.
- Keep escalation artifacts sanitized.

---

## 13) Groq/Free API Guidance

Recommended beginner path:
- Start with Groq for low-cost experimentation.
- Keep model name configurable via env.
- Add provider abstraction (`llm_client.py`) so provider can be swapped later.

Note:
- Free-tier limits can affect test stability. Build retries and small backoff.

### Groq quick-start (beginner-friendly)
1. Create/sign in to a Groq account: [https://console.groq.com/](https://console.groq.com/)
2. Open API Keys and create a new key.
3. Save it in `.env`:
   - `LLM_PROVIDER=groq`
   - `GROQ_API_KEY=<your_key>`
   - `LLM_MODEL=llama-3.1-8b-instant`
4. Test a simple request before wiring agents.

### Recommended starter model
- Start with `llama-3.1-8b-instant` for lower cost and fast iteration during development.
- If you need better reasoning quality for tricky cases, upgrade to a larger model after baseline flow is stable.

---

## 14) What "Done" Looks Like (Definition of Done)

Project is complete when:
- All mandatory kata requirements are implemented.
- All 8 required scenarios run successfully.
- Outputs include evidence + customer/internal notes.
- MCP is used for part of the tool layer.
- Reproducible setup and docs are complete.
- Limitations and next improvements are documented.

---

## 15) Suggested Execution Rhythm for Mentoring

Suggested rhythm is phase-based (not day-based). Each phase can take less or more time depending on learner pace:
- Phase 0-1: setup, config, domain contracts
- Phase 2: RAG ingestion + retrieval quality checks
- Phase 3: local tools + MCP integration path
- Phase 4-5: graph orchestration + decision/response guardrails
- Phase 6-7: scenario completion + final packaging

---

## 16) Immediate Next Step (After Your Confirmation)

Once confirmed, we execute Phase 0 and Phase 1 first:
1. Scaffold the project with `uv`.
2. Add clean folder layout.
3. Implement typed domain entities.
4. Add baseline tests and run them.

Then we proceed incrementally phase-by-phase with checkpoints defined in `PHASE_IMPLEMENTATION_GUIDE.md`.
