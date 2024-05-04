import dayjs from "dayjs";

export const getLocalNow = (localTzOffsetHours: number) => {
  const thisTzOffsetHours = new Date().getTimezoneOffset() / 60;
  return dayjs().subtract(localTzOffsetHours - thisTzOffsetHours, "hours");
};
