import { env } from "@/lib/env";
import { beginnerProvider } from "@/lib/resolver/providers/beginner";
import { standardProvider } from "@/lib/resolver/providers/standard";
import type { ResolverProvider } from "@/lib/resolver/types";

export const getResolverProvider = (): ResolverProvider => {
  if (env.resolverProvider === "standard") {
    return standardProvider;
  }
  return beginnerProvider;
};
