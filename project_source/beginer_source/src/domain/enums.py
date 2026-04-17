from enum import Enum


class DecisionType(str, Enum):
    RESOLVE = "resolve"
    CLARIFY = "clarify"
    ESCALATE = "escalate"


class IssueType(str, Enum):
    BILLING = "billing"
    ENTITLEMENT = "entitlement"
    TOKEN_AUTH = "token_auth"
    REST_API = "rest_api"
    SAML_IDENTITY = "saml_identity"
    MIXED = "mixed"
    UNKNOWN = "unknown"
