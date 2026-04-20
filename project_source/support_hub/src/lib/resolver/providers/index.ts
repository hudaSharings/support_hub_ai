import { resolverProvider } from "@/lib/resolver/providers/resolver";
import type { ResolverProvider } from "@/lib/resolver/types";

export const getResolverProvider = (): ResolverProvider => {
  return resolverProvider;
};
