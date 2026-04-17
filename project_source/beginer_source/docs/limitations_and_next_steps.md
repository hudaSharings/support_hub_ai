# Limitations and Next Steps

## Current limitations
- Vector index is rebuilt in-process and not persisted/reused efficiently across restarts.
- Session/thread memory is in-process only and not durable across restarts.
- No authentication/authorization on the beginner API endpoints.
- Tool data comes from local mock business dataset.
- No persistent database layer for case/session history.

## Next improvements
- Persist and reuse vector collections with ingestion/versioning controls.
- Add real MCP server deployment and secure auth between app and MCP server.
- Add persistence layer (SQLite/Postgres).
- Add richer decision policy with confidence scoring.
- Add API auth, rate limiting, and observability for UI-facing usage.
