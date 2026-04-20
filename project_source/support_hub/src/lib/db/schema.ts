import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const caseStatusEnum = pgEnum("case_status", [
  "new",
  "triage_pending",
  "clarification_required",
  "ready_for_resolution",
  "resolved_pending_confirmation",
  "escalated",
  "closed",
  "reopened",
]);

export const decisionEnum = pgEnum("resolver_decision", [
  "resolve",
  "clarify",
  "escalate",
]);

export const providerEnum = pgEnum("resolver_provider", ["resolver"]);
export const userRoleEnum = pgEnum("user_role", ["agent", "admin", "viewer"]);
export const globalRoleEnum = pgEnum("global_role", ["user", "super_admin"]);

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull().unique(),
  customerName: text("customer_name").notNull(),
  region: varchar("region", { length: 64 }),
  supportTier: varchar("support_tier", { length: 64 }),
  status: varchar("status", { length: 64 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const enterpriseAccounts = pgTable("enterprise_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  enterpriseId: varchar("enterprise_id", { length: 64 }).notNull().unique(),
  enterpriseName: text("enterprise_name").notNull(),
  supportTier: varchar("support_tier", { length: 64 }),
  samlEnabled: boolean("saml_enabled").default(false).notNull(),
  accountStatus: varchar("account_status", { length: 64 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const githubOrganizations = pgTable("github_organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 64 }).notNull().unique(),
  orgName: text("org_name").notNull(),
  customerId: varchar("customer_id", { length: 64 }),
  enterpriseId: varchar("enterprise_id", { length: 64 }),
  currentPlan: varchar("current_plan", { length: 64 }),
  billingStatus: varchar("billing_status", { length: 64 }),
  ssoEnabled: boolean("sso_enabled").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: varchar("subscription_id", { length: 64 }).notNull().unique(),
  scopeType: varchar("scope_type", { length: 32 }).notNull(),
  scopeId: varchar("scope_id", { length: 64 }).notNull(),
  planName: varchar("plan_name", { length: 64 }).notNull(),
  billingCycle: varchar("billing_cycle", { length: 32 }),
  renewalDate: timestamp("renewal_date", { withTimezone: true }),
  activeStatus: boolean("active_status").default(true).notNull(),
  pendingChange: text("pending_change"),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: varchar("invoice_id", { length: 64 }).notNull().unique(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  billingPeriod: varchar("billing_period", { length: 64 }),
  amountInCents: integer("amount_in_cents").notNull(),
  currency: varchar("currency", { length: 16 }).default("USD").notNull(),
  paymentStatus: varchar("payment_status", { length: 32 }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
});

export const entitlements = pgTable("entitlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  entitlementId: varchar("entitlement_id", { length: 64 }).notNull().unique(),
  scopeType: varchar("scope_type", { length: 32 }).notNull(),
  scopeId: varchar("scope_id", { length: 64 }).notNull(),
  featureName: varchar("feature_name", { length: 128 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  source: varchar("source", { length: 64 }).notNull(),
});

export const tokenRecords = pgTable("token_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenId: varchar("token_id", { length: 64 }).notNull().unique(),
  tokenType: varchar("token_type", { length: 64 }).notNull(),
  owner: varchar("owner", { length: 128 }),
  orgId: varchar("org_id", { length: 64 }),
  permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
  ssoAuthorized: boolean("sso_authorized").default(false).notNull(),
  expirationDate: timestamp("expiration_date", { withTimezone: true }),
  revoked: boolean("revoked").default(false).notNull(),
});

export const samlConfigurations = pgTable("saml_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  samlConfigId: varchar("saml_config_id", { length: 64 }).notNull().unique(),
  scopeId: varchar("scope_id", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  idpName: varchar("idp_name", { length: 128 }),
  certificateExpiry: timestamp("certificate_expiry", { withTimezone: true }),
  lastValidated: timestamp("last_validated", { withTimezone: true }),
});

export const apiUsage = pgTable("api_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  usageId: varchar("usage_id", { length: 64 }).notNull().unique(),
  scopeId: varchar("scope_id", { length: 64 }).notNull(),
  apiType: varchar("api_type", { length: 32 }).notNull(),
  timeWindow: varchar("time_window", { length: 64 }).notNull(),
  requestCount: integer("request_count").default(0).notNull(),
  throttledRequests: integer("throttled_requests").default(0).notNull(),
});

export const supportCases = pgTable("support_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull().unique(),
  customerId: varchar("customer_id", { length: 64 }),
  orgId: varchar("org_id", { length: 64 }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 32 }).default("medium").notNull(),
  status: caseStatusEnum("status").default("new").notNull(),
  issueCategory: varchar("issue_category", { length: 64 }),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const caseHistoryEvents = pgTable("case_history_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: varchar("event_id", { length: 64 }).notNull().unique(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  actor: varchar("actor", { length: 128 }).notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceStatuses = pgTable("service_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceStatusId: varchar("service_status_id", { length: 64 }).notNull().unique(),
  component: varchar("component", { length: 128 }).notNull(),
  region: varchar("region", { length: 64 }),
  status: varchar("status", { length: 64 }).notNull(),
  incidentId: varchar("incident_id", { length: 64 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentId: varchar("incident_id", { length: 64 }).notNull().unique(),
  title: text("title").notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  affectedServices: jsonb("affected_services").$type<string[]>().default([]).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  status: varchar("status", { length: 64 }).notNull(),
});

export const resolverRuns = pgTable("resolver_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  provider: providerEnum("provider").notNull(),
  requestPayload: jsonb("request_payload").$type<Record<string, unknown>>().notNull(),
  responsePayload: jsonb("response_payload").$type<Record<string, unknown>>(),
  success: boolean("success").default(false).notNull(),
  errorMessage: text("error_message"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const supportCaseAiOutcomes = pgTable("support_case_ai_outcomes", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull().unique(),
  issueType: varchar("issue_type", { length: 64 }),
  decision: decisionEnum("decision"),
  decisionRationale: text("decision_rationale"),
  customerResponse: text("customer_response"),
  internalNote: text("internal_note"),
  missingInformation: jsonb("missing_information")
    .$type<string[]>()
    .default([])
    .notNull(),
  docsEvidence: jsonb("docs_evidence")
    .$type<Record<string, unknown>[]>()
    .default([])
    .notNull(),
  toolEvidence: jsonb("tool_evidence")
    .$type<Record<string, unknown>[]>()
    .default([])
    .notNull(),
  escalationArtifactId: varchar("escalation_artifact_id", { length: 128 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resolverProviders = pgTable("resolver_providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: providerEnum("name").notNull().unique(),
  baseUrl: text("base_url").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  globalRole: globalRoleEnum("global_role").default("user").notNull(),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  defaultOrgId: varchar("default_org_id", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userOrgMemberships = pgTable("user_org_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  membershipId: varchar("membership_id", { length: 64 }).notNull().unique(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  orgId: varchar("org_id", { length: 64 }).notNull(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  role: userRoleEnum("role").default("agent").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
