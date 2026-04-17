import "dotenv/config";

import { and, eq } from "drizzle-orm";

import { getDb } from "../src/lib/db/client";
import {
  apiUsage,
  caseHistoryEvents,
  customers,
  enterpriseAccounts,
  entitlements,
  githubOrganizations,
  incidents,
  invoices,
  resolverProviders,
  samlConfigurations,
  serviceStatuses,
  subscriptions,
  supportCaseAiOutcomes,
  supportCases,
  tokenRecords,
} from "../src/lib/db/schema";

const nowIso = () => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const eventId = (suffix: string) => `evt_seed_${suffix}_${nowIso()}`;

const seedProviders = async () => {
  const db = getDb();
  await db
    .insert(resolverProviders)
    .values([
      { name: "beginner", baseUrl: process.env.BEGINNER_RESOLVER_BASE_URL ?? "http://localhost:8000" },
      { name: "standard", baseUrl: process.env.STANDARD_RESOLVER_BASE_URL ?? "http://localhost:8100" },
    ])
    .onConflictDoUpdate({
      target: resolverProviders.name,
      set: { active: true },
    });
};

const seedBusinessEntities = async () => {
  const db = getDb();

  await db
    .insert(customers)
    .values([
      {
        customerId: "cust_acme",
        customerName: "Acme Corp",
        region: "us-east",
        supportTier: "enterprise",
        status: "active",
      },
      {
        customerId: "cust_globex",
        customerName: "Globex",
        region: "eu-west",
        supportTier: "pro",
        status: "active",
      },
    ])
    .onConflictDoNothing({ target: customers.customerId });

  await db
    .insert(enterpriseAccounts)
    .values({
      enterpriseId: "ent_acme",
      enterpriseName: "Acme Enterprise",
      supportTier: "enterprise",
      samlEnabled: true,
      accountStatus: "active",
    })
    .onConflictDoNothing({ target: enterpriseAccounts.enterpriseId });

  await db
    .insert(githubOrganizations)
    .values([
      {
        orgId: "org_acme_platform",
        orgName: "acme-platform",
        customerId: "cust_acme",
        enterpriseId: "ent_acme",
        currentPlan: "enterprise_cloud",
        billingStatus: "paid",
        ssoEnabled: true,
      },
      {
        orgId: "org_globex_api",
        orgName: "globex-api",
        customerId: "cust_globex",
        enterpriseId: null,
        currentPlan: "team",
        billingStatus: "past_due",
        ssoEnabled: false,
      },
    ])
    .onConflictDoNothing({ target: githubOrganizations.orgId });

  await db
    .insert(subscriptions)
    .values([
      {
        subscriptionId: "sub_acme_ent",
        scopeType: "enterprise",
        scopeId: "ent_acme",
        planName: "enterprise_cloud",
        billingCycle: "annual",
        activeStatus: true,
      },
      {
        subscriptionId: "sub_globex_team",
        scopeType: "organization",
        scopeId: "org_globex_api",
        planName: "team",
        billingCycle: "monthly",
        activeStatus: true,
        pendingChange: "Upgrade requested to enterprise in next cycle",
      },
    ])
    .onConflictDoNothing({ target: subscriptions.subscriptionId });

  await db
    .insert(invoices)
    .values([
      {
        invoiceId: "inv_acme_2026_03",
        customerId: "cust_acme",
        billingPeriod: "2026-03",
        amountInCents: 2400000,
        currency: "USD",
        paymentStatus: "paid",
      },
      {
        invoiceId: "inv_globex_2026_03",
        customerId: "cust_globex",
        billingPeriod: "2026-03",
        amountInCents: 120000,
        currency: "USD",
        paymentStatus: "open",
      },
    ])
    .onConflictDoNothing({ target: invoices.invoiceId });

  await db
    .insert(entitlements)
    .values([
      {
        entitlementId: "entitlement_acme_saml",
        scopeType: "enterprise",
        scopeId: "ent_acme",
        featureName: "saml_sso",
        enabled: true,
        source: "subscription",
      },
      {
        entitlementId: "entitlement_globex_actions",
        scopeType: "organization",
        scopeId: "org_globex_api",
        featureName: "actions_minutes",
        enabled: true,
        source: "subscription",
      },
    ])
    .onConflictDoNothing({ target: entitlements.entitlementId });

  await db
    .insert(tokenRecords)
    .values([
      {
        tokenId: "token_acme_gha_01",
        tokenType: "app",
        owner: "acme-platform-bot",
        orgId: "org_acme_platform",
        permissions: ["checks:write", "contents:read"],
        ssoAuthorized: true,
        revoked: false,
      },
      {
        tokenId: "token_globex_pat_01",
        tokenType: "pat",
        owner: "globex-admin",
        orgId: "org_globex_api",
        permissions: ["repo"],
        ssoAuthorized: false,
        revoked: false,
      },
    ])
    .onConflictDoNothing({ target: tokenRecords.tokenId });

  await db
    .insert(samlConfigurations)
    .values({
      samlConfigId: "saml_ent_acme",
      scopeId: "ent_acme",
      enabled: true,
      idpName: "Okta",
      lastValidated: new Date(),
    })
    .onConflictDoNothing({ target: samlConfigurations.samlConfigId });

  await db
    .insert(apiUsage)
    .values([
      {
        usageId: "usage_org_acme_1h",
        scopeId: "org_acme_platform",
        apiType: "rest",
        timeWindow: "1h",
        requestCount: 285000,
        throttledRequests: 1800,
      },
      {
        usageId: "usage_org_globex_1h",
        scopeId: "org_globex_api",
        apiType: "graphql",
        timeWindow: "1h",
        requestCount: 8200,
        throttledRequests: 12,
      },
    ])
    .onConflictDoNothing({ target: apiUsage.usageId });
};

const seedCasesAndOps = async () => {
  const db = getDb();
  const caseRows = [
    {
      caseId: "CASE-1001",
      customerId: "cust_acme",
      orgId: "org_acme_platform",
      title: "SAML sign-in fails after certificate rollover",
      description:
        "Users receive invalid_signature during enterprise SSO login. Started after IdP cert update.",
      severity: "high",
      status: "ready_for_resolution" as const,
      issueCategory: "auth_sso",
      metadata: { channel: "email", product_area: "enterprise" },
    },
    {
      caseId: "CASE-1002",
      customerId: "cust_globex",
      orgId: "org_globex_api",
      title: "Unexpected API throttling spikes",
      description:
        "Burst traffic causes secondary rate-limit errors although requests should remain within purchased capacity.",
      severity: "medium",
      status: "triage_pending" as const,
      issueCategory: "api_rate_limits",
      metadata: { channel: "web", product_area: "api" },
    },
  ];

  await db.insert(supportCases).values(caseRows).onConflictDoNothing({ target: supportCases.caseId });

  await db
    .insert(incidents)
    .values({
      incidentId: "inc_api_us_east_2026_04_17",
      title: "US-East API elevated latency",
      severity: "medium",
      affectedServices: ["api-gateway", "checks-service"],
      startTime: new Date(Date.now() - 1000 * 60 * 45),
      status: "monitoring",
    })
    .onConflictDoNothing({ target: incidents.incidentId });

  await db
    .insert(serviceStatuses)
    .values([
      {
        serviceStatusId: "svc_api_gateway_use1",
        component: "api-gateway",
        region: "us-east",
        status: "degraded_performance",
        incidentId: "inc_api_us_east_2026_04_17",
      },
      {
        serviceStatusId: "svc_actions_runner_global",
        component: "actions-runner",
        region: "global",
        status: "operational",
        incidentId: null,
      },
    ])
    .onConflictDoNothing({ target: serviceStatuses.serviceStatusId });

  await db
    .insert(supportCaseAiOutcomes)
    .values({
      caseId: "CASE-1001",
      issueType: "saml_auth_failure",
      decision: "clarify",
      decisionRationale: "Need IdP metadata and assertion trace to isolate cert mismatch.",
      customerResponse:
        "Please share your updated IdP metadata XML and one failed SAML response trace (redacted).",
      internalNote: "Potential cert chain rollover mismatch.",
      missingInformation: ["idp_metadata_xml", "saml_assertion_trace"],
      docsEvidence: [{ doc_id: "auth-saml-rollover", confidence: 0.86 }],
      toolEvidence: [],
      escalationArtifactId: null,
    })
    .onConflictDoNothing({ target: supportCaseAiOutcomes.caseId });

  for (const row of caseRows) {
    const existing = await db.query.caseHistoryEvents.findFirst({
      where: and(
        eq(caseHistoryEvents.caseId, row.caseId),
        eq(caseHistoryEvents.eventType, "case_seeded"),
      ),
    });
    if (!existing) {
      await db.insert(caseHistoryEvents).values({
        eventId: eventId(row.caseId.toLowerCase().replace(/[^a-z0-9]/g, "_")),
        caseId: row.caseId,
        eventType: "case_seeded",
        actor: "seed_script",
        notes: "Initial demo case inserted by db:seed",
      });
    }
  }
};

const run = async () => {
  await seedProviders();
  await seedBusinessEntities();
  await seedCasesAndOps();
  console.log("Seed completed.");
};

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
