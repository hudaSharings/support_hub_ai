# Happy Path Flow - Scenario Resolution

This document shows only the **happy path for support scenarios**.
It focuses on how a scenario moves from input to final outcome when the system behaves normally.

---

## 1) Scenario Engine in One Line

A support case comes in, the system gathers doc evidence + account evidence, then decides `resolve`, `clarify`, or `escalate`, and returns customer + internal responses.

---

## 2) Common Happy Path (All Scenarios)

```mermaid
flowchart LR
    A[Input Support Case] --> B[Triage]
    B --> C[RAG Retrieval]
    B --> D[Tool Checks]
    C --> E[Decision]
    D --> E
    E --> F[Response Generation]
    F --> G[Customer Message + Internal Note]
```

This is the base flow all scenarios follow.

---

## 3) Runtime Happy Path (Detailed)

```mermaid
sequenceDiagram
    participant SA as Support Analyst
    participant WF as Workflow
    participant RG as RAG
    participant TL as Tools
    participant DC as Decision
    participant RS as Response

    SA->>WF: Submit support case
    WF->>WF: Triage issue category
    WF->>RG: Retrieve top-k doc evidence
    WF->>TL: Run local/MCP tools
    RG-->>WF: Cited document chunks
    TL-->>WF: Case-specific findings
    WF->>DC: Merge evidence + findings
    DC-->>WF: Outcome (resolve/clarify/escalate)
    WF->>RS: Build customer + internal outputs
    RS-->>SA: Final response package
```

---

## 4) Scenario Happy Paths (Required Cases)

### Scenario 1: Feature entitlement dispute

```mermaid
flowchart TD
    A[Customer says feature missing] --> B[Triage as entitlement]
    B --> C[Check entitlement + subscription]
    B --> D[Retrieve feature/plan docs]
    C --> E[Merge evidence]
    D --> E
    E --> F{Entitlement should be enabled?}
    F -- Yes --> G[Resolve with corrective guidance]
    F -- No --> H[Clarify plan limitation with evidence]
```

### Scenario 2: Paid features locked

```mermaid
flowchart TD
    A[Paid features unavailable] --> B[Triage as billing_or_plan]
    B --> C[Check subscription + invoice/payment status]
    B --> D[Retrieve billing docs]
    C --> E[Merge evidence]
    D --> E
    E --> F{Billing or activation issue found?}
    F -- Yes --> G[Resolve with billing/action steps]
    F -- No --> H[Clarify additional account details]
```

### Scenario 3: PAT fails for org resources

```mermaid
flowchart TD
    A[PAT works partly, fails on org] --> B[Triage as token_auth]
    B --> C[Check token permissions + expiry + SSO auth]
    B --> D[Check org token policy]
    B --> E[Retrieve PAT/SSO docs]
    C --> F[Merge evidence]
    D --> F
    E --> F
    F --> G[Resolve/Clarify/Escalate with rationale]
```

### Scenario 4: REST API rate-limit complaint

```mermaid
flowchart TD
    A[Case: API failing] --> B[Triage as rest_api]
    B --> C[Retrieve rate-limit docs]
    B --> D[Check API usage + incident status]
    C --> E[Combine evidence]
    D --> E
    E --> F{Enough evidence?}
    F -- Yes --> G[Resolve with guidance]
    F -- No --> H[Clarify missing details]
```

---

### Scenario 5: SAML SSO login failure

```mermaid
flowchart TD
    A[SAML login failure reported] --> B[Triage as saml_identity]
    B --> C[Check SAML config + certificate + scope]
    B --> D[Check incidents and prior case history]
    B --> E[Retrieve SAML troubleshooting docs]
    C --> F[Merge evidence]
    D --> F
    E --> F
    F --> G{Enterprise-level blocker or repeated failures?}
    G -- Yes --> H[Escalate with full evidence packet]
    G -- No --> I[Resolve or clarify with precise next steps]
```

### Scenario 6: Repeated unresolved authentication issue

```mermaid
flowchart TD
    A[Repeated auth failures in history] --> B[Triage auth_repeat]
    B --> C[Check case history + prior attempts]
    B --> D[Check token/SSO current state]
    C --> E[Merge evidence]
    D --> E
    E --> F{Repeated unresolved confirmed?}
    F -- Yes --> G[Escalate with timeline + findings]
    F -- No --> H[Resolve/Clarify based on latest evidence]
```

### Scenario 7: Ambiguous complaint

```mermaid
flowchart TD
    A["GitHub is broken for our org"] --> B[Triage unknown]
    B --> C[Collect minimal context fields]
    B --> D[Run lightweight checks + broad retrieval]
    C --> E[Assess evidence sufficiency]
    D --> E
    E --> F{Enough data to diagnose?}
    F -- No --> G[Clarify with targeted questions]
    F -- Yes --> H[Proceed to resolve/escalate]
```

### Scenario 8: Billing plus technical issue

```mermaid
flowchart TD
    A[Billing + automation/API impact] --> B[Triage mixed_issue]
    B --> C[Check billing/subscription state]
    B --> D[Check technical symptoms tools]
    B --> E[Retrieve billing + API/auth docs]
    C --> F[Merge evidence]
    D --> F
    E --> F
    F --> G{High business impact + unresolved risk?}
    G -- Yes --> H[Escalate with business impact note]
    G -- No --> I[Resolve with coordinated action plan]
```

---

## 5) Outcome Happy Path

```mermaid
flowchart LR
    A[Evidence merged] --> B{Decision}
    B -->|resolve| C[Actionable fix + customer steps]
    B -->|clarify| D[Targeted information request]
    B -->|escalate| E[Escalation artifact + internal handoff]
```

---

## 6) Common Scenario Deviations

- Retrieval returns weak citations -> refine query and chunking.
- Tool outputs conflict with docs -> mark conflict and choose `clarify` or `escalate`.
- Missing critical identifiers -> immediate `clarify`.
- Repeated unresolved + high impact -> `escalate` with history evidence.

---

## 7) What This Document Is For

Use this document to understand expected scenario resolution flows.
For technical implementation details, use `PHASE_IMPLEMENTATION_GUIDE.md` and `LLD.md`.
