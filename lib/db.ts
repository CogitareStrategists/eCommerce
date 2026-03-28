import { Pool } from "pg";

const globalForPool = globalThis as unknown as { _pool?: Pool };

export const pool =
  globalForPool._pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPool._pool = pool;
