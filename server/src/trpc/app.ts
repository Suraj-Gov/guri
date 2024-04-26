import { router } from ".";
import { userAuthRouter } from "../handlers/user";

export const appRouter = router({
  user: userAuthRouter,
});

export type AppRouter = typeof appRouter;
