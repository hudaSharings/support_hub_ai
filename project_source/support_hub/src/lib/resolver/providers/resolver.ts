import { env } from "@/lib/env";
import type {
  ResolverOutput,
  ResolverProvider,
  SupportCaseInputPayload,
} from "@/lib/resolver/types";

const jsonHeaders = {
  "Content-Type": "application/json",
};

export const resolverProvider: ResolverProvider = {
  providerName: "resolver",
  async health() {
    const res = await fetch(`${env.resolverBaseUrl}/health`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Resolver health failed: ${res.status}`);
    }
    return (await res.json()) as { status: string };
  },
  async resolveCase(payload: SupportCaseInputPayload): Promise<ResolverOutput> {
    const res = await fetch(`${env.resolverBaseUrl}/resolve`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resolver resolve failed: ${res.status} ${body}`);
    }

    return (await res.json()) as ResolverOutput;
  },
};
