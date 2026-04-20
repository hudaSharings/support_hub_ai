ALTER TABLE "resolver_providers" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "resolver_runs" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
DELETE FROM "resolver_providers" WHERE "name" = 'standard';--> statement-breakpoint
UPDATE "resolver_providers" SET "name" = 'resolver' WHERE "name" = 'beginner';--> statement-breakpoint
INSERT INTO "resolver_providers" ("name", "base_url", "active")
SELECT 'resolver', 'http://localhost:8000', true
WHERE NOT EXISTS (
  SELECT 1 FROM "resolver_providers" WHERE "name" = 'resolver'
);--> statement-breakpoint
UPDATE "resolver_runs" SET "provider" = 'resolver' WHERE "provider" IN ('beginner', 'standard');--> statement-breakpoint
DROP TYPE "public"."resolver_provider";--> statement-breakpoint
CREATE TYPE "public"."resolver_provider" AS ENUM('resolver');--> statement-breakpoint
ALTER TABLE "resolver_providers" ALTER COLUMN "name" SET DATA TYPE "public"."resolver_provider" USING "name"::"public"."resolver_provider";--> statement-breakpoint
ALTER TABLE "resolver_runs" ALTER COLUMN "provider" SET DATA TYPE "public"."resolver_provider" USING "provider"::"public"."resolver_provider";