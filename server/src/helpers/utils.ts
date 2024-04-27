import dayjs, { type Dayjs } from "dayjs";
import type { TaskSchedule } from "../db/models";

const setToday = (time: Dayjs, now: Dayjs) => {
  const todayTimestamp = time
    .set("date", now.date())
    .set("month", now.month())
    .set("year", now.year());
  return todayTimestamp;
};

export const getNextReminderTimestamp = (schedule: TaskSchedule) => {
  let now = dayjs().add(schedule.tzHoursOffset, "hour");
  const todayDayIdx = now.get("d");
  let dayOffset = 0;
  const isToday = schedule.days.includes(todayDayIdx);
  if (!isToday) {
    let i = todayDayIdx;
    while (schedule.days[i] !== -1) {
      dayOffset += 1;
      i = (i + 1) % 7;
    }
  }
  now.add(dayOffset);

  for (const t of schedule.reminderTimestamps) {
    const ts = setToday(dayjs(t), now);
    if (ts.isAfter(now)) {
      return ts;
    }
  }
};
