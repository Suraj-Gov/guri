import { router } from ".";
import { goalRouter } from "../handlers/goals";
import { userAuthRouter } from "../handlers/user";

export const appRouter = router({
  user: userAuthRouter,
  goals: goalRouter,
});

export type AppRouter = typeof appRouter;
