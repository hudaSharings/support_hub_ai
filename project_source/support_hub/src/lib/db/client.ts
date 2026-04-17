import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

export const getDb = () => {
  const pool = new Pool({ connectionString: env.databaseUrl });
  return drizzle({ client: pool, schema });
};
