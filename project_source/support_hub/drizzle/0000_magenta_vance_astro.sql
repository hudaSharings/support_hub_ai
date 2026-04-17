CREATE TYPE "public"."case_status" AS ENUM('new', 'triage_pending', 'clarification_required', 'ready_for_resolution', 'resolved_pending_confirmation', 'escalated', 'closed', 'reopened');--> statement-breakpoint
CREATE TYPE "public"."resolver_decision" AS ENUM('resolve', 'clarify', 'escalate');--> statement-breakpoint
CREATE TYPE "public"."resolver_provider" AS ENUM('beginner', 'standard');--> statement-breakpoint
CREATE TABLE "api_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usage_id" varchar(64) NOT NULL,
	"scope_id" varchar(64) NOT NULL,
	"api_type" varchar(32) NOT NULL,
	"time_window" varchar(64) NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"throttled_requests" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "api_usage_usage_id_unique" UNIQUE("usage_id")
);
--> statement-breakpoint
CREATE TABLE "case_history_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(64) NOT NULL,
	"case_id" varchar(64) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"actor" varchar(128) NOT NULL,
	"notes" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_history_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"customer_name" text NOT NULL,
	"region" varchar(64),
	"support_tier" varchar(64),
	"status" varchar(64) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "enterprise_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar(64) NOT NULL,
	"enterprise_name" text NOT NULL,
	"support_tier" varchar(64),
	"saml_enabled" boolean DEFAULT false NOT NULL,
	"account_status" varchar(64) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enterprise_accounts_enterprise_id_unique" UNIQUE("enterprise_id")
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entitlement_id" varchar(64) NOT NULL,
	"scope_type" varchar(32) NOT NULL,
	"scope_id" varchar(64) NOT NULL,
	"feature_name" varchar(128) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"source" varchar(64) NOT NULL,
	CONSTRAINT "entitlements_entitlement_id_unique" UNIQUE("entitlement_id")
);
--> statement-breakpoint
CREATE TABLE "github_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(64) NOT NULL,
	"org_name" text NOT NULL,
	"customer_id" varchar(64),
	"enterprise_id" varchar(64),
	"current_plan" varchar(64),
	"billing_status" varchar(64),
	"sso_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_organizations_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"severity" varchar(32) NOT NULL,
	"affected_services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"status" varchar(64) NOT NULL,
	CONSTRAINT "incidents_incident_id_unique" UNIQUE("incident_id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar(64) NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"billing_period" varchar(64),
	"amount_in_cents" integer NOT NULL,
	"currency" varchar(16) DEFAULT 'USD' NOT NULL,
	"payment_status" varchar(32) NOT NULL,
	"due_date" timestamp with time zone,
	CONSTRAINT "invoices_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "resolver_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "resolver_provider" NOT NULL,
	"base_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resolver_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "resolver_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar(64) NOT NULL,
	"provider" "resolver_provider" NOT NULL,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb,
	"success" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saml_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saml_config_id" varchar(64) NOT NULL,
	"scope_id" varchar(64) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"idp_name" varchar(128),
	"certificate_expiry" timestamp with time zone,
	"last_validated" timestamp with time zone,
	CONSTRAINT "saml_configurations_saml_config_id_unique" UNIQUE("saml_config_id")
);
--> statement-breakpoint
CREATE TABLE "service_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_status_id" varchar(64) NOT NULL,
	"component" varchar(128) NOT NULL,
	"region" varchar(64),
	"status" varchar(64) NOT NULL,
	"incident_id" varchar(64),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_statuses_service_status_id_unique" UNIQUE("service_status_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar(64) NOT NULL,
	"scope_type" varchar(32) NOT NULL,
	"scope_id" varchar(64) NOT NULL,
	"plan_name" varchar(64) NOT NULL,
	"billing_cycle" varchar(32),
	"renewal_date" timestamp with time zone,
	"active_status" boolean DEFAULT true NOT NULL,
	"pending_change" text,
	CONSTRAINT "subscriptions_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
CREATE TABLE "support_case_ai_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar(64) NOT NULL,
	"issue_type" varchar(64),
	"decision" "resolver_decision",
	"decision_rationale" text,
	"customer_response" text,
	"internal_note" text,
	"missing_information" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"docs_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tool_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"escalation_artifact_id" varchar(128),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_case_ai_outcomes_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "support_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar(64) NOT NULL,
	"customer_id" varchar(64),
	"org_id" varchar(64),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(32) DEFAULT 'medium' NOT NULL,
	"status" "case_status" DEFAULT 'new' NOT NULL,
	"issue_category" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_cases_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "token_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" varchar(64) NOT NULL,
	"token_type" varchar(64) NOT NULL,
	"owner" varchar(128),
	"org_id" varchar(64),
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sso_authorized" boolean DEFAULT false NOT NULL,
	"expiration_date" timestamp with time zone,
	"revoked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "token_records_token_id_unique" UNIQUE("token_id")
);
