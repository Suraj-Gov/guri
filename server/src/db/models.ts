import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
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

// --- goals
export const goalsTable = namespace.table("goals", {
  id: serial("id").primaryKey(),
  userId: integer("uid")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  status: text("status").notNull(),
  achieveTill: timestamp("achieve_till").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}
export const goalFields = createSelectSchema(goalsTable, {
  status: z.nativeEnum(GoalStatus),
});

// --- tasks
export const tasksTable = namespace.table("tasks", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .notNull()
    .references(() => goalsTable.id),
  title: text("title").notNull(),
  count: integer("count").notNull().default(0),
  countToAchieve: integer("count_to_achieve").notNull(),
  schedule: jsonb("schedule").notNull(),
  shouldRemind: boolean("should_remind").notNull().default(false),
  nextReminderAt: timestamp("next_reminder_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  enqueuedTaskID: text("enqueued_task_id"),
});
const scheduleSchema = z.object({
  days: z.number().min(-1).max(6).array().length(7),
  timesPerDay: z.number(),
  reminderTimestamps: z.string(/** iso date */).array(),
  tzHoursOffset: z.number(),
});
export type TaskSchedule = z.infer<typeof scheduleSchema>;
export const tasksFields = createSelectSchema(tasksTable, {
  schedule: scheduleSchema,
});
export type UserTask = z.infer<typeof tasksFields>;

// --- tasklogs
export const taskLogsTable = namespace.table("task_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasksTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  countAfterAction: integer("count_after_action").notNull(),
});
