# project_source

This folder contains two AI resolver templates and one shared business application:

- `beginer_source/` - simplified beginner-friendly structure
- `standard_source/` - standard layered architecture structure
- `support_hub/` - shared Next.js ticketing/business app that integrates resolver APIs

`support_hub` is designed to stay stable while resolver providers can switch from beginner to standard.

## How to run

### `beginer_source`

```bash
cd beginer_source
uv sync
cp .env.example .env
uv run python -m src.app.main --health
uv run python -m src.app.main --demo
uv run python -m src.app.main --run-scenarios
```

Run API server (for Postman/UI):
```bash
uv run python -m src.app.main --serve-api --host 0.0.0.0 --port 8000
```

Quick Postman checks (beginner API):

- Health check
  - Method: `GET`
  - URL: `http://localhost:8000/health`

- Resolve case
  - Method: `POST`
  - URL: `http://localhost:8000/resolve`
  - Header: `Content-Type: application/json`
  - Body:
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

### `standard_source`

```bash
cd standard_source
uv sync
cp .env.example .env
uv run python -m src.app.main --health
uv run python -m src.app.main --demo
```

### `support_hub`

```bash
cd support_hub
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Use `RESOLVER_PROVIDER=beginner` initially and point `BEGINNER_RESOLVER_BASE_URL` to the beginner API host.
