ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "password" varchar(255);
UPDATE "app_users" SET "password" = 'Pass@123' WHERE "password" IS NULL OR "password" = '';
ALTER TABLE "app_users" ALTER COLUMN "password" SET NOT NULL;