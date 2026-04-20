const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const normalizeDatabaseUrl = (value: string): string => {
  try {
    const url = new URL(value);
    // Avoid pg warning and keep strict TLS semantics.
    if (url.searchParams.get("sslmode") === "require") {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return value;
  }
};

export const env = {
  get databaseUrl(): string {
    return normalizeDatabaseUrl(required(process.env.DATABASE_URL, "DATABASE_URL"));
  },
  resolverBaseUrl: process.env.RESOLVER_BASE_URL ?? "http://localhost:8000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Support Hub",
};
