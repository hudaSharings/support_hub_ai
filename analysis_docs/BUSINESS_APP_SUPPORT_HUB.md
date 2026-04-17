# Support Hub Business Application Design

## Purpose

`support_hub` is a shared business application for support operations across both AI resolver implementations:

- `project_source/beginer_source`
- `project_source/standard_source`

The business app is the system of record for tickets and core business entities. AI resolver services are integrated as external engines that provide structured resolution guidance.

This separation keeps domain workflows stable while AI backends evolve.

## Scope and Boundaries

### In Scope

- Ticket creation and management UX
- Business data management for core kata entities
- Resolver-provider abstraction to call beginner first, standard later
- Human-in-the-loop review of AI outcomes
- Audit trail of resolver requests and responses
- Routing and lifecycle transitions based on AI decision (`resolve`, `clarify`, `escalate`)

### Out of Scope

- Re-implementing AI orchestration inside Next.js
- Owning vector/RAG ingestion pipelines
- Replacing resolver-side tools and MCP internals

## High-Level Architecture

- **Frontend + Backend**: Next.js (App Router, route handlers, server actions)
- **Database**: Neon PostgreSQL
- **ORM/Migrations**: Drizzle ORM + drizzle-kit
- **UI**: Tailwind CSS + shadcn/ui
- **AI Integration**: HTTP provider client for resolver APIs

Data and flow:

1. Support user creates or updates a case in `support_hub`.
2. App stores case and linked entities in Postgres.
3. User triggers AI resolution.
4. App maps case to resolver payload (`SupportCaseInput` compatible).
5. Selected provider calls `/resolve` on resolver service.
6. App stores raw response + normalized outcome snapshot.
7. UI shows recommendation with actions (accept draft, ask customer, escalate).

## Core Business Entities (Final_kata aligned)

Minimum entities to support the kata and operations:

- `customers`
- `github_organizations`
- `enterprise_accounts`
- `subscriptions`
- `invoices`
- `entitlements`
- `token_records`
- `saml_configurations`
- `api_usage`
- `support_cases`
- `case_history_events`
- `service_statuses`
- `incidents`

Additional operational entities for integration:

- `resolver_runs` (request/response logs per invocation)
- `resolver_providers` (provider config and active status)
- `support_case_ai_outcomes` (latest structured recommendation per case)

## Canonical Support Case Lifecycle

Recommended lifecycle states:

- `new`
- `triage_pending`
- `clarification_required`
- `ready_for_resolution`
- `resolved_pending_confirmation`
- `escalated`
- `closed`
- `reopened`

Decision-to-status mapping:

- `resolve` -> `resolved_pending_confirmation`
- `clarify` -> `clarification_required`
- `escalate` -> `escalated`

## Resolver Integration Contract

Business app sends case payload mapped to resolver contract:

- `case_id` (business app case id)
- `title`
- `description`
- `customer_id` (optional)
- `org_id` (optional)
- `severity` (default `medium`)
- `issue_category_hint` (optional)
- `session_id` / `thread_id` (optional continuity keys)
- `metadata` (token/feature/other hints)

Business app receives and stores at least:

- `issue_type`
- `decision`
- `decision_rationale`
- `customer_response`
- `internal_note`
- `docs_evidence`
- `tool_evidence`
- `missing_information`
- `escalation_artifact_id`

## Provider Abstraction Strategy

The app must not bind domain workflows to one resolver implementation.

Define a provider interface:

- `resolveCase(input): Promise<ResolverOutput>`
- `health(): Promise<ProviderHealth>`
- optional `ingest(urls)` for provider-specific admin paths

Initial provider:

- `beginnerProvider` -> calls `beginer_source` API (`/health`, `/resolve`, `/ingest`)

Future provider:

- `standardProvider` -> same business contract, different base URL and implementation details

Provider selection:

- environment default (`RESOLVER_PROVIDER=beginner`)
- per-case override field for migration testing
- admin UI toggle for controlled rollout

## Data Model Notes

### Keys and Traceability

- Use UUID primary keys for internal tables.
- Keep externally meaningful ids (`case_id`, `org_id`, `customer_id`) as unique business keys.
- Each resolver run references a case and provider, and stores:
  - request payload
  - response payload
  - latency
  - success/failure
  - timestamp

### Auditability

- Never overwrite previous resolver runs.
- Keep immutable run log entries.
- Store latest denormalized AI outcome for fast UI access.

## Initial UX Modules (MVP)

1. Dashboard with case counters by status/decision.
2. Case list with filters (status, org, severity, updated date).
3. Case details:
   - core case fields
   - entity context panels
   - AI outcomes tab
   - resolver run history tab
4. Create/Edit case form.
5. "Run AI Resolution" action with provider indicator.

## Security and Operational Considerations

- Server-side provider credentials and base URLs only (no client exposure).
- Strict payload validation before resolver calls.
- Retry policy with idempotency key for resolution runs.
- Timeout and circuit breaker config by provider.
- PII-safe logs (mask sensitive fields where needed).

## Migration and Environment Strategy

Environment variables:

- `DATABASE_URL` (Neon)
- `RESOLVER_PROVIDER` (`beginner` or `standard`)
- `BEGINNER_RESOLVER_BASE_URL`
- `STANDARD_RESOLVER_BASE_URL`
- `NEXT_PUBLIC_APP_NAME`

Drizzle migration workflow:

1. `drizzle-kit generate`
2. `drizzle-kit migrate`
3. optional seed script for demo entities and cases

## Implementation Plan

### Phase 1 - Foundation

- Scaffold Next.js app with Tailwind and shadcn
- Configure Drizzle + Neon
- Create schema and first migrations
- Implement repository layer and validation

### Phase 2 - Core Ticket Operations

- Build CRUD for support cases
- Build list/detail pages
- Build basic history/event tracking

### Phase 3 - AI Integration (Beginner)

- Add provider abstraction and beginner provider client
- Add run-resolution API action
- Persist resolver runs and latest outcomes
- Reflect decision in case lifecycle

### Phase 4 - Provider Expansion (Standard)

- Add standard provider implementation
- Add provider selection policies
- Add comparison mode for selected cases (optional)

## Acceptance Criteria (Business App)

- Can create and manage support cases and related entities.
- Can call beginner resolver and persist full result.
- Case status updates correctly based on resolver decision.
- Maintains complete run history and audit trail.
- Configuration supports switching resolver provider without schema changes.

## Future Enhancements (Post-MVP)

- SLA timers and breach alerts
- Assignment and queue management
- Approval gates for high-risk categories
- Analytics on decision quality and reopen rates
- Feedback loop from agent actions to resolver quality improvements
