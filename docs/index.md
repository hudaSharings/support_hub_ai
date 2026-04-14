# Document Alignment Map

This map helps learners and mentors quickly navigate the documentation set without confusion.

---

## Canonical Document Set

- [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) - overall goals, stack, phased roadmap, acceptance criteria
- [`HLD.md`](./HLD.md) - architecture vision, boundaries, high-level diagrams, NFRs
- [`LLD.md`](./LLD.md) - module-level design, data contracts, state model, interfaces, test design
- [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) - phase-by-phase code snippets with tutor explanations
- [`Final_kata.md`](../Final_kata.md) - assignment source-of-truth requirements

---

## Which Document to Read First

- **Mentor / architect path:** [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) -> [`HLD.md`](./HLD.md) -> [`LLD.md`](./LLD.md) -> [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md)
- **Beginner student path:** [`HLD.md`](./HLD.md) -> [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) -> [`LLD.md`](./LLD.md)

This beginner order starts with big-picture understanding, then moves into guided code practice, and finally covers deeper low-level details.

---

## Section-Level Crosswalk

- **Problem + scope**
  - [`Final_kata.md`](../Final_kata.md)
  - [`HLD.md`](./HLD.md) sections: Objective, Scope, Functional Mapping

- **Architecture and reasoning**
  - [`HLD.md`](./HLD.md) sections: High-Level Architecture, Component View, Runtime Flow, Decision Policy

- **Concrete module/file structure**
  - [`LLD.md`](./LLD.md) section: Source Tree
  - [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) section: Project Structure

- **Data contracts and graph state**
  - [`LLD.md`](./LLD.md) sections: Data Contracts, LangGraph State Design
  - [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) phases 1 and 4 snippets

- **RAG design and implementation**
  - [`LLD.md`](./LLD.md) section: RAG Internals
  - [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) phase 2 snippets

- **Tooling (Local + MCP)**
  - [`LLD.md`](./LLD.md) section: Tool Layer Design
  - [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) phase 3 snippets

- **Decision + response quality**
  - [`LLD.md`](./LLD.md) section: Decision Engine
  - [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) phase 5 snippets

- **Scenarios and evaluation**
  - [`LLD.md`](./LLD.md) sections: Testing Plan, Scenario-to-Tool Coverage Matrix
  - [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) phase 6 snippets

- **Submission readiness**
  - [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) Definition of Done
  - [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) phase 7

---

## Naming Consistency Rules

Use these names everywhere (code, docs, discussions):

- RAG modules:
  - `src/rag/corpus_loader.py`
  - `src/rag/normalizer.py`
  - `src/rag/chunker.py`
  - `src/rag/indexer.py`
  - `src/rag/retriever.py`

- Tool modules:
  - `src/tools/contracts.py`
  - `src/tools/local/customer_context.py`
  - `src/tools/local/subscription_lookup.py`
  - `src/tools/local/entitlement_check.py`
  - `src/tools/local/token_diagnostics.py`
  - `src/tools/local/case_history_lookup.py`
  - `src/tools/local/service_status_lookup.py`
  - `src/tools/local/escalation_artifact.py`
  - `src/tools/mcp/mcp_client.py`
  - `src/tools/mcp/mcp_tool_registry.py`
  - `src/tools/mcp/mcp_wrapped_tools.py`

- Graph modules:
  - `src/graph/state.py`
  - `src/graph/nodes.py`
  - `src/graph/edges.py`
  - `src/graph/workflow.py`

- Scenario and evaluation:
  - `src/scenarios/fixtures/`
  - `src/scenarios/run_scenarios.py`
  - `src/evaluation/validators.py`
  - `src/evaluation/report_writer.py`

---

## Governance Rule for Future Updates

If any file/module name changes in one doc, update all docs in this order:
1. `docs/LLD.md`
2. `docs/PHASE_IMPLEMENTATION_GUIDE.md`
3. `docs/PROJECT_PLAN.md`
4. `docs/index.md`

This prevents drift between design and implementation guides.
