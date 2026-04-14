# HLD - Technical Customer Support Resolution System

## 1. Objective

Build a **multi-agent technical support resolution system** for GitHub.com support workflows that can:
- understand support cases,
- gather evidence from docs and tools,
- decide one of `resolve | clarify | escalate`,
- produce both customer-facing and internal responses.

This HLD is written for beginners and focuses on **why each block exists** before implementation details.

---

## 2. Scope and Non-Goals

## In Scope
- Multi-agent architecture
- RAG over GitHub Docs corpus
- Tool layer with at least partial MCP integration
- Eight required scenarios from kata
- Structured output with evidence and decision trail

## Out of Scope (for first version)
- Direct integration with real GitHub private support systems
- Full human-agent UI workflow management
- Advanced analytics dashboard

---

## 3. Functional Requirements Mapping

The system must support:
- Plan and billing troubleshooting
- Entitlement disputes
- PAT/auth issues
- API failure and rate-limit diagnosis
- SAML/identity issues
- Repeated unresolved issue escalation
- Ambiguous case clarification
- Mixed billing + technical issue handling

And always output:
- likely issue type
- docs evidence
- tools used
- key findings
- decision (`resolve`, `clarify`, `escalate`)
- customer response
- internal note

---

## 4. High-Level Architecture

```mermaid
flowchart LR
    A[Support Agent Input Case] --> B[Intake/Triage Agent]
    B --> C[RAG Retrieval Agent]
    B --> D[Tool Agent]
    C --> E[Decision Agent]
    D --> E
    E -->|resolve| F[Response Agent]
    E -->|clarify| F
    E -->|escalate| F
    F --> G[Final Structured Output]

    C --> H[(Vector Store)]
    H --> I[(GitHub Docs Corpus)]
    D --> J[(Local Tools)]
    D --> K[(MCP Tools)]
    K --> L[(MCP Server)]
```

### Why this shape?
- **Triage** narrows search space and tool usage.
- **RAG agent** provides grounded documentation evidence.
- **Tool agent** fetches case-specific facts (cannot be solved by docs alone).
- **Decision agent** enforces outcome policy.
- **Response agent** formats communication for external and internal audiences.

---

## 5. Context Diagram (System Boundary)

```mermaid
flowchart TB
    U[Support Analyst] --> S[Support Resolution System]
    S --> O1[Customer-Facing Resolution]
    S --> O2[Internal Support Note]
    S --> O3[Escalation Artifact]

    S --> D1[GitHub Docs Snapshot Corpus]
    S --> D2[Mock/Seed Business Data]
    S --> D3[MCP Tool Provider]
    S --> D4[LLM Provider e.g. Groq]
```

---

## 6. Logical Component View

```mermaid
flowchart TB
    subgraph APP[Application Layer]
      API[CLI/API Entry]
      WF[Workflow Orchestrator - LangGraph]
    end

    subgraph AGENTS[Agent Layer]
      T1[Triage Agent]
      T2[Retrieval Agent]
      T3[Tool Agent]
      T4[Decision Agent]
      T5[Response Agent]
    end

    subgraph DATA[Data and Knowledge Layer]
      R1[Retriever]
      V1[(Vector DB - Chroma)]
      M1[(Business Entities Store)]
      A1[(Scenario Fixtures)]
    end

    subgraph INTEGRATIONS[Tool Integration Layer]
      L1[Local Tool Adapters]
      M2[MCP Client Adapter]
      M3[MCP Server Tools]
    end

    subgraph PLATFORM[Platform Services]
      P1[Config and Secrets]
      P2[Logging and Trace]
      P3[Test and Evaluation Harness]
    end

    API --> WF
    WF --> T1 --> T2 --> R1 --> V1
    WF --> T3 --> L1 --> M1
    WF --> T3 --> M2 --> M3
    WF --> T4 --> T5
    WF --> P2
    API --> P1
    API --> P3
    A1 --> API
```

---

## 7. End-to-End Runtime Flow

```mermaid
sequenceDiagram
    participant SA as Support Analyst
    participant OR as Orchestrator
    participant TR as Triage Agent
    participant RG as Retrieval Agent
    participant TL as Tool Agent
    participant DC as Decision Agent
    participant RS as Response Agent

    SA->>OR: submit case(title, description, ids)
    OR->>TR: classify issue and required evidence
    TR-->>OR: issue_category + missing_info_flags

    par RAG evidence
      OR->>RG: retrieve relevant docs
      RG-->>OR: cited doc chunks + confidence
    and Case facts
      OR->>TL: run context tools
      TL-->>OR: tool findings + risk indicators
    end

    OR->>DC: combine evidence + findings
    DC-->>OR: decision(resolve/clarify/escalate) + rationale

    OR->>RS: generate external + internal response
    RS-->>OR: formatted outputs
    OR-->>SA: final support resolution package
```

---

## 8. Decision Policy (Business Logic at High Level)

```mermaid
flowchart TD
    A[Start with case + evidence + tool findings] --> B{Enough trustworthy evidence?}
    B -- No --> C[Outcome = clarify]
    B -- Yes --> D{Critical risk or repeated unresolved issue?}
    D -- Yes --> E[Outcome = escalate]
    D -- No --> F{Issue actionable through docs + tools?}
    F -- Yes --> G[Outcome = resolve]
    F -- No --> C
```

---

## 9. Data Domains (Conceptual)

```mermaid
erDiagram
    CUSTOMER ||--o{ GITHUB_ORGANIZATION : owns
    CUSTOMER ||--o{ SUPPORT_CASE : raises
    GITHUB_ORGANIZATION ||--o{ SUBSCRIPTION : has
    GITHUB_ORGANIZATION ||--o{ ENTITLEMENT : has
    GITHUB_ORGANIZATION ||--o{ TOKEN_RECORD : uses
    GITHUB_ORGANIZATION ||--o{ SAML_CONFIGURATION : configures
    SUPPORT_CASE ||--o{ CASE_HISTORY : contains
    CUSTOMER ||--o{ INVOICE : billed
    GITHUB_ORGANIZATION ||--o{ API_USAGE : generates
    SERVICE_STATUS ||--o{ INCIDENT : links
```

This model supports:
- account-level diagnosis,
- entitlement verification,
- auth and policy debugging,
- history-aware escalation.

---

## 10. Non-Functional Requirements

## Reliability
- deterministic tool contracts
- timeout/retry wrappers around LLM/tool calls
- fallback to `clarify` when uncertain

## Scalability
- stateless orchestrator node logic
- swappable vector store and LLM provider
- decoupled tool adapters (local and MCP)

## Observability
- trace ID per case
- per-node logs
- persisted evidence trail for audit

## Security
- secrets in env only
- sensitive values masked in logs
- validation on all tool inputs/outputs

---

## 11. Deployment View (Initial)

```mermaid
flowchart LR
    A[Developer Machine or VM] --> B[Python App Process]
    B --> C[(Vector DB Local Disk)]
    B --> D[(Docs Snapshot Files)]
    B --> E[(Mock Data JSON)]
    B --> F[LLM API Provider]
    B --> G[MCP Server Process]
```

For first release, this local deployment is enough. Later it can evolve to containerized services.

---

## 12. Risks and Mitigations

- RAG retrieves weak chunks -> improve chunking metadata and query expansion.
- LLM output inconsistency -> use strict schema + output parser.
- MCP tool instability -> circuit breaker and fallback to local read-only diagnostics.
- Beginner complexity overload -> phase-based build with weekly checkpoints.

---

## 13. HLD Acceptance Checklist

- Architecture supports all mandatory kata requirements.
- Multi-agent flow and decision routing are explicit.
- RAG + tools + MCP integration are visible in design.
- Outputs include both customer and internal artifacts.
- Design enables reliable, testable, incremental implementation.
