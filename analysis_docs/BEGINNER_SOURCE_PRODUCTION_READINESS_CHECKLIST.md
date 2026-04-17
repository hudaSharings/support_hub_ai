# Beginner Source Production Readiness Checklist

## Purpose

This checklist tracks what is needed to move `project_source/beginer_source` from kata/demo readiness to production readiness.

The current system is functionally complete for Final_kata scenarios, but production operation requires additional controls for reliability, security, observability, and maintainability.

## Current Status Summary

- **Kata readiness:** complete (8 scenarios, API and CLI flows, RAG, tools, MCP integration path).
- **Production readiness:** partial; core hardening work remains.

---

## Priority Levels

- **P0:** Must-have before any production traffic.
- **P1:** Should-have immediately after P0 for stable operations.
- **P2:** Improvement and scale enhancements.

---

## P0 - Mandatory Before Production

### 1) Runtime and Dependency Reproducibility

- [ ] Lock and validate runtime versions (Python, uv, core libs) for all environments.
- [ ] Enforce startup checks for required packages and env variables.
- [ ] Add deterministic bootstrap script for local/stage/prod parity.

**Acceptance criteria**
- Fresh environment bootstraps with one command and passes health check.
- Deployment fails fast with clear error if required config is missing.

### 2) API Security and Access Control

- [ ] Add API authentication for `/resolve` and `/ingest`.
- [ ] Add authorization boundaries (caller/service identity scopes).
- [ ] Add request size limits and schema validation hardening.
- [ ] Implement basic abuse protections (rate limit, IP/service quota).

**Acceptance criteria**
- Unauthenticated calls are rejected.
- Authorized callers are auditable and traceable.

### 3) Persistent Conversation/Workflow State

- [ ] Replace in-memory checkpointer dependency for production flows.
- [ ] Persist thread/session continuity in a durable store.
- [ ] Define retention and TTL policy for state records.

**Acceptance criteria**
- Restarting service does not lose active case continuity.
- State retrieval works reliably across multiple instances.

### 4) Observability Baseline

- [ ] Add structured logging with correlation IDs (`case_id`, `thread_id`, request ID).
- [ ] Add metrics: latency, success/error rates, decision distribution, tool failures.
- [ ] Add operational dashboards and alert thresholds.

**Acceptance criteria**
- Every production request is traceable end-to-end.
- Alerts fire for error spikes and degraded latency.

### 5) Reliability and Failure Handling

- [ ] Add global request timeouts.
- [ ] Add bounded retries for transient provider/tool failures.
- [ ] Add circuit-breaker/backoff for unstable dependencies.
- [ ] Define graceful fallback behavior when LLM or MCP is unavailable.

**Acceptance criteria**
- Service degrades gracefully under dependency failures.
- Tail latency remains within agreed SLO during partial outages.

### 6) Deployment Packaging and Release Gates

- [ ] Provide production container image and runtime entrypoint.
- [ ] Add CI pipeline gates: lint, tests, scenario regression, build artifact.
- [ ] Add environment promotion strategy (dev -> stage -> prod).

**Acceptance criteria**
- Release artifact is immutable and reproducible.
- No deployment without passing CI quality gates.

---

## P1 - Strongly Recommended Immediately After P0

### 7) Data Governance and Privacy

- [ ] Classify sensitive fields in requests/responses.
- [ ] Redact/mask sensitive content in logs and stored traces.
- [ ] Define retention/deletion lifecycle for case artifacts.

**Acceptance criteria**
- No sensitive secrets/tokens appear in logs.
- Retention policy is documented and enforced.

### 8) Output Quality and Safety Controls

- [ ] Add confidence/risk policy for `resolve` vs `clarify` vs `escalate`.
- [ ] Add guardrails for unsupported claims in customer responses.
- [ ] Add policy tests for high-risk categories (billing/auth/SAML).

**Acceptance criteria**
- High-risk cases enforce human-in-the-loop rules.
- Regression suite catches policy violations before release.

### 9) Tooling and MCP Hardening

- [ ] Add strict tool call contracts and error taxonomies.
- [ ] Add MCP timeout/retry and fallback behavior contract.
- [ ] Add tool-level health checks and readiness diagnostics.

**Acceptance criteria**
- Tool failures are classified and actionable.
- MCP incidents do not cascade into full service outage.

### 10) RAG Operational Controls

- [ ] Add corpus versioning and index metadata.
- [ ] Add ingestion job observability and failure recovery.
- [ ] Add retrieval quality checks for top scenario classes.

**Acceptance criteria**
- Corpus/index version is visible in every resolver run.
- Retrieval regressions are detectable in CI or pre-release checks.

---

## P2 - Scale and Optimization

### 11) Horizontal Scale and Multi-Tenant Readiness

- [ ] Validate stateless API scaling assumptions.
- [ ] Define tenant isolation boundaries for data and rate limits.
- [ ] Add load and soak tests.

### 12) Cost and Performance Optimization

- [ ] Add LLM/token usage telemetry and budget alerts.
- [ ] Add caching policy for frequent retrieval/tool lookups.
- [ ] Tune retrieval and prompt paths for latency/quality balance.

### 13) Analytics and Continuous Improvement

- [ ] Track outcomes: reopen rate, escalation precision, resolution quality.
- [ ] Build feedback loop from support-agent edits/overrides.
- [ ] Add periodic prompt/tool policy review process.

---

## Deployment Readiness Gate (Go/No-Go)

Use this gate before production launch:

- [ ] All **P0** items complete and validated in staging.
- [ ] Incident response runbook exists and has been tested.
- [ ] SLOs defined (availability, p95 latency, error budget).
- [ ] Rollback plan and data migration rollback tested.
- [ ] Security review completed.

If any P0 item is not complete, production launch is **No-Go**.

---

## Suggested Execution Plan

### Week 1
- P0 items 1-3 (runtime, security baseline, persistent state).

### Week 2
- P0 items 4-6 (observability, reliability controls, deployment gates).

### Week 3
- P1 items 7-10 and production soak test in staging.

### Week 4
- Go/No-Go review and controlled production rollout.

---

## Owner Tracking Template

For each item, track:

- **Owner**
- **Target date**
- **Status** (`not started`, `in progress`, `blocked`, `done`)
- **Evidence link** (PR, dashboard, runbook, test report)

This checklist is intended to be a living document and should be updated as controls are implemented.
