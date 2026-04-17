# Standard Output Examples

All outputs follow `SupportResolutionOutput` schema.

## 1) Resolve Example

```json
{
  "issue_type": "rest_api_rate_limit",
  "docs_evidence": [
    {
      "source_url": "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
      "chunk_id": "rate-limits::chunk::4",
      "excerpt": "The REST API imposes a primary rate limit...",
      "relevance_score": 0.91
    }
  ],
  "tools_used": ["get_api_usage", "get_service_incidents"],
  "important_findings": [
    "Request count exceeded threshold in current window",
    "No active incident affecting API availability"
  ],
  "decision": "resolve",
  "decision_rationale": "Evidence indicates request throttling, not platform outage.",
  "customer_response": "Your requests are currently being rate-limited. We recommend pacing requests and using conditional requests.",
  "internal_note": "Rate-limit verified via API usage tool and docs citations. Shared mitigation guidance.",
  "escalation_artifact_id": null
}
```

## 2) Clarify Example

```json
{
  "issue_type": "ambiguous_complaint",
  "docs_evidence": [],
  "tools_used": ["get_customer_org_context"],
  "important_findings": [
    "Insufficient identifiers to run targeted diagnostics"
  ],
  "decision": "clarify",
  "decision_rationale": "Missing org identifier and failing endpoint details.",
  "customer_response": "Please share your organization name, failing endpoint/action, timestamp, and full error message.",
  "internal_note": "Sent targeted clarification request. Re-run triage once required fields are provided.",
  "escalation_artifact_id": null
}
```

## 3) Escalate Example

```json
{
  "issue_type": "saml_identity",
  "docs_evidence": [
    {
      "source_url": "https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/troubleshooting-saml-authentication",
      "chunk_id": "saml-troubleshooting::chunk::7",
      "excerpt": "Common causes include certificate mismatch...",
      "relevance_score": 0.88
    }
  ],
  "tools_used": ["get_saml_config", "get_case_history", "get_service_incidents"],
  "important_findings": [
    "Repeated unresolved attempts in previous cases",
    "Enterprise-level SAML configuration mismatch likely"
  ],
  "decision": "escalate",
  "decision_rationale": "High-impact repeated issue with enterprise IAM scope requires specialist handling.",
  "customer_response": "We have escalated this SAML issue to our specialist team and will provide an update shortly.",
  "internal_note": "Escalated due to repeated unresolved SAML failures and enterprise-scope configuration risk.",
  "escalation_artifact_id": "ESC-2026-0042"
}
```
