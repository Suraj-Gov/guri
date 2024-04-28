import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tasksTable, type TaskSchedule, type UserTaskLogs } from "../db/models";
import { env } from "../env";
import { Tasker } from "./cloudTasks";

// to convert to user relative, add to utc
// to know user relative on server, subtract from utc
export const getNextReminderTimestamp = (schedule: TaskSchedule) => {
  let localNow = dayjs().subtract(schedule.tzHoursOffset, "hour");
  const todayDayIdx = localNow.get("d");
  let dayOffset = 0;
  const isToday = schedule.days.includes(todayDayIdx);
  if (!isToday) {
    let i = todayDayIdx;
    while (schedule.days[i] !== -1) {
      dayOffset += 1;
      i = (i + 1) % 7;
    }
  }
  localNow.add(dayOffset, "day");

  for (const h of schedule.remindAtHours) {
    const ts = localNow.set("hour", h).set("minute", 0).set("second", 0);
    if (ts.isAfter(localNow)) {
      return ts;
    }
  }
};

export const enqueueReminder = async (id: number, time: Date) => {
  const tasker = Tasker.getInstance();
  const enqueueID = await tasker.enqueueTask({
    payload: { json: { id } },
    time,
    url: env.BASE_URL + "/trpc/tasks.notify",
  });
  if (enqueueID.val) {
    await db
      .update(tasksTable)
      .set({
        nextReminderAt: time,
        enqueuedTaskID: enqueueID.val,
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, id));
  }
};

export const canMarkProgress = (
  schedule: TaskSchedule,
  taskLogs: UserTaskLogs[]
): {
  isAllowed: boolean;
  message: string;
} => {
  const localNow = dayjs().subtract(schedule.tzHoursOffset, "hour");
  const todayDay = localNow.get("day");
  const isAllowedToday = schedule.days.includes(todayDay);
  if (!isAllowedToday) {
    return {
      isAllowed: false,
      message: `Today was off the schedule.<br />Do you want to mark your progress?`,
    };
  }

  // check if they have already marked for today
  const localStartOfDay = localNow.startOf("day");
  let marksSinceStartOfDay = 0;
  taskLogs.forEach((l) => {
    const wasMarkedToday =
      dayjs(l.createdAt).diff(localStartOfDay, "hours") < 24;
    if (wasMarkedToday) {
      marksSinceStartOfDay++;
    }
  });
  if (marksSinceStartOfDay < schedule.timesPerDay) {
    const marksLeft = schedule.timesPerDay - marksSinceStartOfDay - 1;
    return {
      isAllowed: true,
      message:
        marksLeft === 0
          ? `Good job! You're done for the day.`
          : `Nice! ${marksLeft} more to go.`,
    };
  } else {
    return {
      isAllowed: false,
      message: `You're done for today.<br />Do you want to mark an extra progress?`,
    };
  }
};
