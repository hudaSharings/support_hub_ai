CREATE TYPE "public"."global_role" AS ENUM('user', 'super_admin');--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "global_role" "global_role" DEFAULT 'user' NOT NULL;