import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

export const getDb = () => {
  const sql = neon(env.databaseUrl);
  return drizzle({ client: sql, schema });
};
