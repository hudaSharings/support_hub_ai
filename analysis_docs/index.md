# Document Alignment Map

This map helps learners and mentors quickly navigate the documentation set without confusion.

---

## Canonical Document Set

- [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) - overall goals, stack, phased roadmap, acceptance criteria
- [`HLD.md`](./HLD.md) - architecture vision, boundaries, high-level diagrams, NFRs
- [`LLD.md`](./LLD.md) - module-level design, data contracts, state model, interfaces, test design
- [`PHASE_IMPLEMENTATION_GUIDE.md`](./PHASE_IMPLEMENTATION_GUIDE.md) - phase-by-phase code snippets with tutor explanations
- [`BUSINESS_APP_SUPPORT_HUB.md`](./BUSINESS_APP_SUPPORT_HUB.md) - shared business app architecture for ticketing + resolver integration
- [`BEGINNER_SOURCE_PRODUCTION_READINESS_CHECKLIST.md`](./BEGINNER_SOURCE_PRODUCTION_READINESS_CHECKLIST.md) - deployment hardening checklist for `beginer_source`
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

Use these names everywhere (code, docs, discussions) for `project_source/beginer_source`:

- RAG modules:
  - `src/rag/corpus_loader.py`
  - `src/rag/chunker.py`
  - `src/rag/indexer.py`
  - `src/rag/retriever.py`

- Tool modules:
  - `src/tools/contracts.py`
  - `src/tools/local/toolkit.py`
  - `src/tools/mcp/mcp_client.py`
  - `src/tools/mcp/mcp_tools.py`

- Orchestration modules:
  - `src/graph/support_case_graph.py`
  - `src/workflow/case_resolution.py`

- Runtime and scenarios:
  - `src/app/main.py`
  - `src/app/api.py`
  - `src/scenarios/fixtures/`
  - `src/scenarios/run_scenarios.py`
  - `src/evaluation/validators.py`

---

## Governance Rule for Future Updates

If any file/module name changes in one doc, update all docs in this order:
1. `analysis_docs/LLD.md`
2. `analysis_docs/PHASE_IMPLEMENTATION_GUIDE.md`
3. `analysis_docs/PROJECT_PLAN.md`
4. `analysis_docs/index.md`

This prevents drift between design and implementation guides.
