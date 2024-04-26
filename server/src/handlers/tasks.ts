import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../db";
import { goalsTable, tasksFields, tasksTable } from "../db/models";
import { Result } from "../helpers/result";
import { getNextReminderTimestamp } from "../helpers/utils";

const getTaskFields = tasksFields.pick({ id: true, goalId: true });
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
    const tasks = await db.select().from(tasksTable).where(whereClause);
    return new Result(tasks);
  } catch (err) {
    console.error(err);
    return Result.error("Could not get your tasks");
  }
};

const createTaskInputs = tasksFields.pick({
  goalId: true,
  countToAchieve: true,
  schedule: true,
  shouldRemind: true,
  title: true,
});
const handleCreateGoal = async (
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
    return new Result(newTask);
  } catch (err) {
    console.error(err);
    return Result.error("Could not create a new task for your goal");
  }
};
