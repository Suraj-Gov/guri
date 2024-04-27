import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { and, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../db";
import {
  goalsTable,
  taskLogsTable,
  tasksFields,
  tasksTable,
} from "../db/models";
import { Result } from "../helpers/result";
import { enqueueReminder } from "../helpers/userTaskHelpers";
import { getNextReminderTimestamp } from "../helpers/utils";
import { authedProcedure, router } from "../trpc";

const getTaskFields = tasksFields.pick({ id: true, goalId: true }).partial();
const handleGetTask = async (
  uid: number,
  input: z.infer<typeof getTaskFields>
) => {
  try {
    const whereClause = and(
      eq(goalsTable.userId, uid),
      input.id
        ? eq(tasksTable.id, input.id)
        : input.goalId
        ? eq(goalsTable.id, input.goalId)
        : undefined
    );
    const row = await db
      .select()
      .from(tasksTable)
      .innerJoin(goalsTable, eq(tasksTable.goalId, goalsTable.id))
      .where(whereClause);
    const tasks = row.map((r) => r.tasks);
    return new Result(tasks);
  } catch (err) {
    console.error(err);
    return Result.error("Could not get your tasks");
  }
};

const taskInputs = tasksFields.pick({
  id: true,
  goalId: true,
  countToAchieve: true,
  schedule: true,
  shouldRemind: true,
  title: true,
});
const createTaskInputs = taskInputs.omit({ id: true });
const handleCreateTask = async (
  uid: number,
  input: z.infer<typeof createTaskInputs>
) => {
  try {
    const nextReminderAt = getNextReminderTimestamp(input.schedule)?.toDate();
    const task = await db
      .insert(tasksTable)
      .values({
        ...input,
        count: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReminderAt,
      })
      .returning();

    const newTask = task[0];
    if (!newTask) {
      return Result.error("Could not register your new task");
    }
    if (input.shouldRemind && nextReminderAt) {
      await enqueueReminder(newTask.id, nextReminderAt);
    }
    return new Result(newTask);
  } catch (err) {
    console.error(err);
    return Result.error("Could not create a new task for your goal");
  }
};

const handleUpdateTask = async (
  uid: number,
  input: z.infer<typeof taskInputs>
) => {
  try {
    const { goalId: _, id } = input;
    const update = await db
      .update(tasksTable)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(tasksTable.id, id)))
      .returning();
    const taskData = update[0];
    if (!taskData) {
      return Result.error("Could not receive data after update");
    }

    if (input.shouldRemind) {
      const nextReminderAt = getNextReminderTimestamp(input.schedule);
      const wasAlreadyEnqueued =
        dayjs(taskData.nextReminderAt).diff(nextReminderAt, "hour") < 1;
      if (!wasAlreadyEnqueued && nextReminderAt) {
        enqueueReminder(id, nextReminderAt.toDate());
      }
    } else {
      // TODO delete task
    }

    return new Result(taskData);
  } catch (err) {
    console.error(err);
    return Result.error("Could not update your task");
  }
};

const taskActionFields = tasksFields.pick({ id: true, goalId: true });
const handleTaskAction = async (
  uid: number,
  input: z.infer<typeof taskActionFields>
) => {
  const { id, goalId: _ } = input;
  try {
    const updateTask = await db
      .update(tasksTable)
      .set({
        count: sql`${tasksTable.count} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, id))
      .returning();
    const countAfterAction = updateTask[0]?.count;
    if (!countAfterAction) {
      return Result.error("Could not update this action");
    }
    await db
      .insert(taskLogsTable)
      .values({ countAfterAction, taskId: id, createdAt: new Date() });
    return new Result(updateTask[0]);
  } catch (err) {
    console.error(err);
    return Result.error("Could not update your task on action");
  }
};

const userTaskProcedure = authedProcedure
  .input(tasksFields.pick({ goalId: true }))
  .use(async (opts) => {
    const {
      input: { goalId },
      ctx: { uid },
    } = opts;
    const userGoal = await db
      .select({ goalId: goalsTable.id })
      .from(goalsTable)
      .where(and(eq(goalsTable.id, goalId), eq(goalsTable.userId, uid!)));
    const doesBelong = userGoal[0]?.goalId === goalId;
    if (!doesBelong) {
      throw new TRPCError({
        message: "Task does not belong to user",
        code: "UNAUTHORIZED",
      });
    }
    return opts.next({
      ctx: opts.ctx,
    });
  });

export const tasksRouter = router({
  get: authedProcedure
    .input(getTaskFields)
    .output(tasksFields.array())
    .query(async (opts) => {
      const {
        ctx: { uid },
        input,
      } = opts;

      const res = await handleGetTask(uid!, input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),

  create: userTaskProcedure
    .input(createTaskInputs)
    .output(tasksFields)
    .mutation(async (opts) => {
      const {
        ctx: { uid },
        input,
      } = opts;

      const res = await handleCreateTask(uid!, input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
  update: userTaskProcedure
    .input(taskInputs)
    .output(tasksFields)
    .mutation(async (opts) => {
      const {
        input,
        ctx: { uid },
      } = opts;
      const res = await handleUpdateTask(uid!, input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
  doAction: userTaskProcedure
    .input(taskActionFields)
    .output(tasksFields)
    .mutation(async (opts) => {
      const {
        input,
        ctx: { uid },
      } = opts;
      const res = await handleTaskAction(uid!, input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
  // TODO notify endpoint
});
