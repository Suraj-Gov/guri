import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { GoalStatus, goalFields, goalsTable } from "../db/models";
import { Result } from "../helpers/result";
import { authedProcedure, router } from "../trpc";

const getGoalFields = goalFields.pick({ id: true, status: true }).partial();
const handleGetGoal = async (
  uid: number,
  input: z.infer<typeof getGoalFields>
) => {
  try {
    const whereClause = and(
      eq(goalsTable.userId, uid),
      input.id
        ? eq(goalsTable.id, input.id)
        : input.status
        ? eq(goalsTable.status, input.status)
        : undefined
    );
    const goals = await db.select().from(goalsTable).where(whereClause);
    return new Result(goals);
  } catch (err) {
    console.error(err);
    return Result.error("Could not get your goals");
  }
};

const createGoalInputs = goalFields.pick({ title: true, achieveTill: true });
const handleCreateGoal = async (
  uid: number,
  input: z.infer<typeof createGoalInputs>
) => {
  try {
    // do not exceed 2 active goals
    const goalsCount = await db
      .select({ count: count() })
      .from(goalsTable)
      .where(eq(goalsTable.status, GoalStatus.ACTIVE));
    if (goalsCount[0]?.count === 2) {
      return Result.error("You already have 2 active goals.", "BAD_REQUEST");
    }
    const goal = await db
      .insert(goalsTable)
      .values({
        title: input.title,
        status: GoalStatus.ACTIVE,
        achieveTill: input.achieveTill,
        userId: uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newGoal = goal[0];
    if (!newGoal) {
      return Result.error("Could not register your new goal");
    }
    return new Result(newGoal);
  } catch (err) {
    console.error(err);
    return Result.error("Could not create a new goal");
  }
};

const updateGoalInputs = goalFields.pick({
  id: true,
  achieveTill: true,
  status: true,
  title: true,
});
const handleUpdateGoal = async (
  uid: number,
  input: z.infer<typeof updateGoalInputs>
) => {
  try {
    const update = await db
      .update(goalsTable)
      .set(input)
      .where(and(eq(goalsTable.userId, uid), eq(goalsTable.id, input.id)))
      .returning();
    if (!update[0]) {
      return Result.error("No goal found to update", "NOT_FOUND");
    }
    return new Result(update[0]);
  } catch (err) {
    console.error(err);
    return Result.error("Could not update your goal");
  }
};

export const goalRouter = router({
  get: authedProcedure
    .input(getGoalFields)
    .output(goalFields.array())
    .query(async (opts) => {
      const {
        ctx: { uid },
        input,
      } = opts;
      const res = await handleGetGoal(uid!, input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
  create: authedProcedure
    .input(createGoalInputs)
    .output(goalFields)
    .mutation(async (opts) => {
      const {
        input,
        ctx: { uid },
      } = opts;
      const res = await handleCreateGoal(uid!, input);
      if (res?.error) return res.httpErrResponse();
      return res.val;
    }),
  update: authedProcedure
    .input(updateGoalInputs)
    .output(goalFields)
    .mutation(async (opts) => {
      const {
        input,
        ctx: { uid },
      } = opts;
      const res = await handleUpdateGoal(uid!, input);
      if (res.error) return res.httpErrResponse();
      return res.val;
    }),
});
