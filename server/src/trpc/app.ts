import { router } from ".";
import { goalRouter } from "../handlers/goals";
import { tasksRouter } from "../handlers/tasks";
import { userAuthRouter } from "../handlers/user";

export const appRouter = router({
  user: userAuthRouter,
  goals: goalRouter,
  tasks: tasksRouter,
});

export type AppRouter = typeof appRouter;
