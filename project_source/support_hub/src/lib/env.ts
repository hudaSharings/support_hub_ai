const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  get databaseUrl(): string {
    return required(process.env.DATABASE_URL, "DATABASE_URL");
  },
  resolverProvider: process.env.RESOLVER_PROVIDER ?? "beginner",
  beginnerResolverBaseUrl:
    process.env.BEGINNER_RESOLVER_BASE_URL ?? "http://localhost:8000",
  standardResolverBaseUrl:
    process.env.STANDARD_RESOLVER_BASE_URL ?? "http://localhost:8100",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Support Hub",
};
