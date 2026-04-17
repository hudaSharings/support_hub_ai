import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const normalizeDatabaseUrl = (value: string): string => {
  try {
    const url = new URL(value);
    if (url.searchParams.get("sslmode") === "require") {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return value;
  }
};

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.DATABASE_URL ?? ""),
  },
});
