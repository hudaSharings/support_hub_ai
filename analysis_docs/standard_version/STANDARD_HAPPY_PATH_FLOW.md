# Standard Happy Path Flow - Scenario Resolution

Scenario-focused happy paths for standard architecture version.

## 1) Global Scenario Flow
```mermaid
flowchart LR
  A[Support Case Intake] --> B[Triage]
  B --> C[RAG Evidence]
  B --> D[Tool Evidence]
  C --> E[Decision Policy]
  D --> E
  E --> F[Response Generation]
  F --> G[Customer Response + Internal Note]
```

## 2) Scenario 1 - Entitlement Dispute
```mermaid
flowchart TD
  A[Feature unavailable complaint] --> B[Triage entitlement]
  B --> C[Check entitlement + subscription]
  B --> D[Retrieve plan/feature docs]
  C --> E[Merge evidence]
  D --> E
  E --> F{Expected entitlement active?}
  F -- Yes --> G[Resolve or escalate system mismatch]
  F -- No --> H[Clarify/resolve as plan limitation]
```

## 3) Scenario 2 - Paid Features Locked
```mermaid
flowchart TD
  A[Paid features unavailable] --> B[Triage billing_or_plan]
  B --> C[Check subscription + invoice/payment status]
  B --> D[Retrieve billing docs]
  C --> E[Merge evidence]
  D --> E
  E --> F{Billing/activation issue confirmed?}
  F -- Yes --> G[Resolve with billing activation steps]
  F -- No --> H[Clarify account scope/details]
```

## 4) Scenario 3 - PAT Fails on Org Resources
```mermaid
flowchart TD
  A[PAT partial failure] --> B[Triage token_auth]
  B --> C[Check token scope/expiry/SSO]
  B --> D[Check org token policy]
  B --> E[Retrieve PAT + SSO docs]
  C --> F[Merge evidence]
  D --> F
  E --> F
  F --> G[Resolve/Clarify/Escalate]
```

## 5) Scenario 4 - REST API Rate Limit Complaint
```mermaid
flowchart TD
  A[API failures reported] --> B[Triage rest_api]
  B --> C[Check API usage + throttled requests]
  B --> D[Check incidents]
  B --> E[Retrieve rate-limit docs]
  C --> F[Merge evidence]
  D --> F
  E --> F
  F --> G{Rate limit indicated?}
  G -- Yes --> H[Resolve with throttling guidance]
  G -- No --> I[Clarify or escalate based on findings]
```

## 6) Scenario 5 - SAML SSO Login Failure
```mermaid
flowchart TD
  A[SAML login issue] --> B[Triage saml_identity]
  B --> C[Check SAML config + cert + scope]
  B --> D[Check incidents + repeated history]
  B --> E[Retrieve SAML troubleshooting docs]
  C --> F[Merge evidence]
  D --> F
  E --> F
  F --> G{Repeated unresolved or enterprise blocker?}
  G -- Yes --> H[Escalate]
  G -- No --> I[Resolve/Clarify]
```

## 7) Scenario 6 - Repeated Unresolved Authentication Issue
```mermaid
flowchart TD
  A[Repeated unresolved auth issue] --> B[Triage auth_repeat]
  B --> C[Check case history + prior fixes]
  B --> D[Run latest token/SSO diagnostics]
  C --> E[Merge evidence]
  D --> E
  E --> F{Repeated unresolved confirmed?}
  F -- Yes --> G[Escalate with timeline artifact]
  F -- No --> H[Resolve/Clarify with updated guidance]
```

## 8) Scenario 7 - Ambiguous Complaint
```mermaid
flowchart TD
  A[Generic complaint] --> B[Triage unknown]
  B --> C[Collect required identifiers]
  B --> D[Run broad checks]
  C --> E[Evaluate evidence sufficiency]
  D --> E
  E --> F{Enough information?}
  F -- No --> G[Clarify]
  F -- Yes --> H[Resolve/Escalate]
```

## 9) Scenario 8 - Billing Plus Technical Issue
```mermaid
flowchart TD
  A[Billing + automation/API impact] --> B[Triage mixed_issue]
  B --> C[Check billing/subscription state]
  B --> D[Check technical diagnostics]
  B --> E[Retrieve billing + API/auth docs]
  C --> F[Merge evidence]
  D --> F
  E --> F
  F --> G{High impact and unresolved risk?}
  G -- Yes --> H[Escalate with impact summary]
  G -- No --> I[Resolve with coordinated action plan]
```

## 10) Outcome Coverage Check
- Scenario 1: resolve or clarify
- Scenario 2: resolve or clarify
- Scenario 3: resolve/clarify/escalate
- Scenario 4: resolve or clarify/escalate
- Scenario 5: clarify or escalate (sometimes resolve)
- Scenario 6: escalate-biased
- Scenario 7: clarify-biased
- Scenario 8: resolve or escalate
