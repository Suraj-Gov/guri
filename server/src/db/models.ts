import type { InferSelectModel } from "drizzle-orm";
import {
  integer,
  pgSchema,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const namespace = pgSchema("guri");

// --- users
export const usersTable = namespace.table("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  hashedPassword: text("p_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type User = InferSelectModel<typeof usersTable>;
export const signupFields = createInsertSchema(usersTable)
  .pick({ email: true, name: true })
  .extend({ password: z.string() });

export const userProfileFields = createSelectSchema(usersTable).omit({
  hashedPassword: true,
  createdAt: true,
});
export type UserProfile = z.infer<typeof userProfileFields>;

// --- sessions
export const sessionsTable = namespace.table("sessions", {
  id: text("id").primaryKey(),
  userId: integer("uid")
    .notNull()
    .references(() => usersTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
