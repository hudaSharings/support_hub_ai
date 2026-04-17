CREATE TYPE "public"."user_role" AS ENUM('agent', 'admin', 'viewer');--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"default_org_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "app_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_org_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"org_id" varchar(64) NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"role" "user_role" DEFAULT 'agent' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_org_memberships_membership_id_unique" UNIQUE("membership_id")
);
