import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";

export let queryClient: postgres.Sql;
export let db: PostgresJsDatabase<Record<string, never>>;

export const connectPostgres = () => {
  try {
    queryClient = postgres(env.POSTGRES_URI);
    db = drizzle(queryClient);
    return queryClient;
  } catch (err) {
    console.error("could not connect to postgres", err);
    return null;
  }
};
