# Standard HLD - tech-customer-support-ai

## 1. System Purpose
Internal support analysts submit GitHub.com support cases.  
System gathers evidence (docs + tools), determines the best next action, and generates customer/internal outputs.

## 2. Context and Boundary
```mermaid
flowchart TB
  SA[Support Analyst] --> SYS[tech-customer-support-ai]
  SYS --> CR[Customer Response]
  SYS --> IN[Internal Note]
  SYS --> EA[Escalation Artifact]
  SYS --> DOCS[GitHub Docs Corpus]
  SYS --> DB[(SQLite DB)]
  SYS --> MCP[MCP Server]
  SYS --> LLM[Groq LLM API]
```

## 3. Logical Architecture
```mermaid
flowchart LR
  A[Intake API/CLI] --> B[Workflow Orchestrator]
  B --> C[Triage Agent]
  C --> D[Retriever Agent]
  C --> E[Tool Agent]
  D --> F[Decision Agent]
  E --> F
  F --> G[Response Agent]
  G --> H[Outputs]
  D --> I[(Vector Store)]
  E --> J[(Repositories)]
  E --> K[(MCP Adapters)]
```

## 4. Non-Functional Design
- Reliability: retries, timeout, safe fallback to `clarify`.
- Scalability: stateless orchestration, pluggable LLM/retriever/tool adapters.
- Security: secret isolation, data masking, schema validation.
- Observability: per-case trace id + node-level structured logs.

## 5. Use Case Flows
### PAT Failure (Org Resources)
```mermaid
sequenceDiagram
  participant SA as Support Analyst
  participant WF as Workflow
  participant TL as Tool Agent
  participant RG as Retrieval
  participant DC as Decision
  SA->>WF: PAT fails on org resources
  WF->>TL: token + org policy checks
  WF->>RG: PAT/SSO docs retrieval
  TL-->>WF: token findings
  RG-->>WF: cited docs
  WF->>DC: merged evidence
  DC-->>WF: resolve/clarify/escalate
```

### SAML Failure (Escalation-biased)
```mermaid
flowchart TD
  A[SAML login failure] --> B[Check SAML config and scope]
  B --> C[Check incidents + history]
  C --> D{Repeated unresolved or enterprise blocker?}
  D -- Yes --> E[Escalate with artifact]
  D -- No --> F[Resolve or Clarify]
```

## 6. Outcome Policy
```mermaid
flowchart LR
  A[Evidence Bundle] --> B{Sufficient and consistent?}
  B -- No --> C[Clarify]
  B -- Yes --> D{High risk/repeated unresolved?}
  D -- Yes --> E[Escalate]
  D -- No --> F[Resolve]
```

## 7. Scenario Coverage Matrix
- Scenario 1: entitlement dispute -> plan/entitlement evidence path
- Scenario 2: paid features locked -> billing/subscription path
- Scenario 3: PAT failure on org resources -> token/policy/SSO path
- Scenario 4: API rate limit complaint -> API usage + docs path
- Scenario 5: SAML login failure -> SAML config + incident + history
- Scenario 6: repeated unresolved auth -> escalation-biased history path
- Scenario 7: ambiguous complaint -> clarify-biased missing-info path
- Scenario 8: billing + technical issue -> mixed-evidence coordination path

## 8. MCP and Local Tool Strategy
- Default flow uses local tools for deterministic account checks.
- At least one mandatory tool call is routed through MCP.
- If MCP is unavailable, system records degraded-mode warning and uses local fallback only where safe.
