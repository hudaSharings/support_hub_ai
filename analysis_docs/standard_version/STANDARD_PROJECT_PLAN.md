# Standard Project Plan - tech-customer-support-ai

## 1) Objective
Build a multi-agent GitHub.com support resolution system with:
- RAG over GitHub docs
- case-specific tool evidence
- MCP-backed tools for part of tool layer
- outcome routing: `resolve | clarify | escalate`
- customer and internal outputs

## 2) Standard Architecture Targets
- **Domain-first:** Pydantic domain models independent of framework.
- **Persistence-first:** SQLite for local execution, migration-ready.
- **Repository pattern:** no direct DB calls in agent nodes.
- **Adapter pattern:** local tools + MCP tools behind common interfaces.
- **API-first contracts:** typed intake and output schemas.
- **Operational readiness:** logs, trace IDs, retries, failure policies.

## 3) Recommended Stack
- Python 3.11+
- uv
- FastAPI (or CLI first, API next)
- Pydantic + pydantic-settings
- SQLModel/SQLAlchemy + Alembic
- LangChain + LangGraph
- Chroma + sentence-transformers
- Groq provider (`llama-3.1-8b-instant` starter)
- pytest

## 4) Standard Folder Blueprint
```text
tech-customer-support-ai/
  pyproject.toml
  README.md
  .env.example
  migrations/
  src/
    app/
      main.py
      config.py
      bootstrap.py
      logging.py
      errors.py
    domain/
      entities.py
      support_case.py
      outputs.py
      enums.py
    persistence/
      db.py
      models.py
      repositories/
        case_repository.py
        customer_repository.py
        org_repository.py
        auth_repository.py
    rag/
      corpus_loader.py
      normalizer.py
      chunker.py
      indexer.py
      retriever.py
    tools/
      contracts.py
      local/
      mcp/
    services/
      case_intake_service.py
      evidence_service.py
      decision_service.py
      response_service.py
    agents/
      prompts/
      triage_agent.py
      retrieval_agent.py
      tool_agent.py
      decision_agent.py
      response_agent.py
    graph/
      state.py
      nodes.py
      edges.py
      workflow.py
    api/
      schemas.py
      routes.py
    scenarios/
      fixtures/
      run_scenarios.py
    evaluation/
      validators.py
      report_writer.py
  docs/
    scenario_outputs/
```

## 5) Delivery Phases (Standard)
1. Foundation and contracts
2. Database and repositories
3. RAG ingestion and retrieval quality
4. Tool layer + MCP integration
5. Graph orchestration
6. Decision policy and response quality
7. API/CLI interface hardening
8. Scenario validation and packaging

## 6) Groq Setup
1. Create API key at [https://console.groq.com/](https://console.groq.com/)
2. Set `.env`:
   - `LLM_PROVIDER=groq`
   - `GROQ_API_KEY=...`
   - `LLM_MODEL=llama-3.1-8b-instant`
3. Use retries and timeout wrappers for provider reliability.

## 7) Definition of Done
- All kata mandatory requirements pass.
- All 8 scenarios produce complete, evidence-backed outputs.
- MCP is used in actual execution path.
- DB migrations and startup instructions are reproducible.
- Logs and error handling are in place for debugging and auditability.

## 8) Requirement Traceability and Output Contracts
- Requirement mapping: [`STANDARD_REQUIREMENTS_TRACEABILITY.md`](./STANDARD_REQUIREMENTS_TRACEABILITY.md)
- Output examples for all decisions: [`STANDARD_OUTPUT_EXAMPLES.md`](./STANDARD_OUTPUT_EXAMPLES.md)

## 9) Submission Checklist
- [ ] Source code with reproducible setup
- [ ] README with env/config/run steps
- [ ] Corpus ingestion instructions
- [ ] Design note (HLD + LLD references)
- [ ] Instructions to run all required scenarios
- [ ] Saved outputs for scenarios 1-8
- [ ] Limitations and improvement roadmap
