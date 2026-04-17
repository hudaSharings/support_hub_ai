# Beginner Source - tech-customer-support-ai

This project is a beginner-friendly but complete kata implementation template with:
- LangGraph-based multi-agent workflow (triage, retrieval, tools, decision, response)
- Chroma vector DB + sentence-transformer embeddings for RAG
- Pydantic-based input/output/tool contracts
- local tools plus MCP-backed tools (real HTTP call path + fallback)
- LangChain prompt + parser based LLM orchestration with safe fallback when API/network is unavailable
- full scenario runner for the 8 required scenarios
- outputs including customer and internal notes

## Setup

```bash
uv sync
cp .env.example .env
```

For best code navigation (`Go to Definition/Implementation`), open `project_source/beginer_source` as the workspace root in Cursor.

## Run

Health:
```bash
uv run python -m src.app.main --health
```

Run API server (for Postman/UI):
```bash
uv run python -m src.app.main --serve-api --host 0.0.0.0 --port 8000
```

API endpoints:
- `GET /health`
- `POST /resolve`
- `POST /ingest`

Example `POST /resolve` body:
```json
{
  "case_id": "API-1001",
  "title": "PAT token not working",
  "description": "Token worked last week and now API calls fail.",
  "customer_id": "cust-1",
  "org_id": "org-1",
  "session_id": "user-1",
  "thread_id": "thread-main"
}
```

Demo case:
```bash
uv run python -m src.app.main --demo
```

Ingest RAG corpus from URL seed file (one URL per line):
```bash
uv run python -m src.app.main --ingest-urls-file src/data/docs_seed_urls.txt
```

Run all required scenarios:
```bash
uv run python -m src.app.main --run-scenarios
```

Run a single case from JSON file:
```bash
uv run python -m src.app.main --case-file src/scenarios/fixtures/scenario_3.json
```

Run with session/thread context:
```bash
uv run python -m src.app.main --case-file src/scenarios/fixtures/scenario_3.json --session-id demo-user --thread-id support-thread-1
```

Session/thread state uses LangGraph checkpointer (`InMemorySaver`) and `configurable.thread_id` at invoke time.
Thread id resolution order is: `thread_id` -> `session_id` -> `case_id`.
Memory is in-process only and resets when the app process restarts.

## Scenario outputs

Generated under:
- `docs/scenario_outputs/scenario_1_output.json` ... `scenario_8_output.json`
- `docs/scenario_outputs/summary_report.md`

## Tests

```bash
pytest
```

## Runtime notes

- First-time embedding model download may print Hugging Face warnings and model load logs.
- Set `HF_TOKEN` in `.env` if you want higher HF Hub rate limits and fewer unauthenticated warnings.
- Messages like `UNEXPECTED: embeddings.position_ids` from sentence-transformers model loading are typically informational for this setup and do not indicate resolver failure.

## Project docs
- `docs/design_note.md`
- `docs/ingest_guide.md`
- `docs/limitations_and_next_steps.md`
- `docs/kata_requirements_coverage.md`
