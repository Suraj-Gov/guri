import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  goalsTable,
  taskLogsTable,
  tasksFields,
  tasksTable,
  usersTable,
  type TaskSchedule,
  type UserTask,
} from "../db/models";
import { Emailer } from "../helpers/emailer";
import { Result } from "../helpers/result";
import {
  canMarkProgress,
  enqueueReminder,
  getNextReminderTimestamp,
} from "../helpers/userTaskHelpers";
import { authedProcedure, router, webhookProcedure } from "../trpc";

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
      .where(whereClause)
      .orderBy(desc(tasksTable.updatedAt));
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
const handleCreateTask = async (input: z.infer<typeof createTaskInputs>) => {
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

const handleUpdateTask = async (input: z.infer<typeof taskInputs>) => {
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
        dayjs(taskData.nextReminderAt).diff(nextReminderAt, "hour") < 1 &&
        taskData.enqueuedTaskID;
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

const markProgressInputs = tasksFields
  .pick({ id: true, goalId: true })
  .extend({ force: z.boolean().optional() });
const markProgressOutputs = z.object({
  task: tasksFields,
  message: z.string(),
});
const handleMarkProgress = async (
  input: z.infer<typeof markProgressInputs>
): Promise<Result<z.infer<typeof markProgressOutputs>>> => {
  const { id, force } = input;
  try {
    const [[task], taskLogs] = await Promise.all([
      db.select().from(tasksTable).where(eq(tasksTable.id, id)),
      db
        .select()
        .from(taskLogsTable)
        .where(eq(taskLogsTable.taskId, id))
        .orderBy(desc(taskLogsTable.createdAt))
        .limit(5),
    ]);
    if (!task) {
      return Result.error("Task not found", "NOT_FOUND");
    }

    const { schedule } = task;
    const { isAllowed, message } = force
      ? { isAllowed: true, message: "Good job!" }
      : canMarkProgress(schedule as TaskSchedule, taskLogs);
    if (!isAllowed && !force) {
      return Result.error(message, "BAD_REQUEST");
    }

    const [[updatedTask]] = await Promise.all([
      db
        .update(tasksTable)
        .set({
          count: sql`${tasksTable.count} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(tasksTable.id, id))
        .returning(),
      db.insert(taskLogsTable).values({
        countBeforeAction: task.count,
        taskId: id,
        createdAt: new Date(),
      }),
    ]);
    if (!updatedTask) {
      return Result.error("Could not update task");
    }

    return new Result({ task: updatedTask as UserTask, message });
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

const taskNotifyInputs = z.object({
  id: z.number(),
});
const handleTaskNotify = async (input: z.infer<typeof taskNotifyInputs>) => {
  const data = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, input.id))
    .innerJoin(goalsTable, eq(tasksTable.goalId, goalsTable.id))
    .innerJoin(usersTable, eq(goalsTable.userId, usersTable.id));

  const row = data[0];
  if (!row) {
    return Result.error("Task not found", "NOT_FOUND");
  }

  const {
    users: { name, email },
    goals: { title: goalTitle },
    tasks: { title: taskTitle, count, countToAchieve, shouldRemind },
  } = row;

  const percComplete = ((count / countToAchieve) * 100).toFixed(0);
  const htmlContent = `
<h1>Hey, ${name}</h1>
<p>Reminding you for a task: ${taskTitle}</p>
<p>This will inch you closer to your goal: ${goalTitle} (${percComplete}% complete)</p>
<p>Good luck!</p>`;

  const emailer = Emailer.getInstance();
  await emailer.sendEmail(email, { subject: "Reminder!", htmlContent });
  const nextReminderAt = getNextReminderTimestamp(
    row.tasks.schedule as TaskSchedule
  );
  if (!nextReminderAt) {
    console.warn("Could not get next reminder for task", input.id);
  } else {
    await enqueueReminder(input.id, nextReminderAt.toDate());
  }
  return {};
};

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
      const { input } = opts;

      const res = await handleCreateTask(input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
  update: userTaskProcedure
    .input(taskInputs)
    .output(tasksFields)
    .mutation(async (opts) => {
      const { input } = opts;
      const res = await handleUpdateTask(input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
  markProgress: userTaskProcedure
    .input(markProgressInputs)
    .output(markProgressOutputs)
    .mutation(async (opts) => {
      const { input } = opts;
      const res = await handleMarkProgress(input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
  notify: webhookProcedure.input(taskNotifyInputs).mutation(async (opts) => {
    await handleTaskNotify(opts.input);
    return {};
  }),
});
