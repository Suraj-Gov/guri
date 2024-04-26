import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Lucia, TimeSpan } from "lucia";
import { sessionsTable, usersTable } from "../db/models";

export let lucia: Lucia<
  Record<never, never>,
  {
    email: string;
  }
>;

export const initializeLucia = (
  db: PostgresJsDatabase<Record<string, never>>
) => {
  const adapter = new DrizzlePostgreSQLAdapter(db, sessionsTable, usersTable);
  lucia = new Lucia(adapter, {
    sessionExpiresIn: new TimeSpan(4, "w"),
    sessionCookie: {
      attributes: {
        // set to `true` when using HTTPS
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".surajgovind.me" : undefined,
      },
    },
    getUserAttributes: (attribs) => {
      return {
        email: attribs.email,
      };
    },
  });
};

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    UserId: number;
    DatabaseUserAttributes: {
      email: string;
    };
  }
}
