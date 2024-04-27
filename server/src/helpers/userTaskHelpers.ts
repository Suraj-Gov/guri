import { eq } from "drizzle-orm";
import { db } from "../db";
import { tasksTable } from "../db/models";
import { env } from "../env";
import { Tasker } from "./cloudTasks";

export const enqueueReminder = async (id: number, time: Date) => {
  const tasker = Tasker.getInstance();
  // TODO specify URL
  const enqueueID = await tasker.enqueueTask({
    payload: { id },
    time,
    url: env.BASE_URL,
  });
  if (enqueueID.val) {
    await db
      .update(tasksTable)
      .set({ enqueuedTaskID: enqueueID.val })
      .where(eq(tasksTable.id, id));
  }
};
