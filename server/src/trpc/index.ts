import { TRPCError, initTRPC } from "@trpc/server";
import { isUserAuthorized } from "../auth/user";
import type { TRPCContext } from "./context";

export const t = initTRPC.context<TRPCContext>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(async (opts) => {
  const cookie = opts.ctx.req.headers.cookie;
  if (!cookie) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in" });
  }

  const { isAuthorized, sessionCookie, uid } = await isUserAuthorized(cookie);
  if (sessionCookie) {
    opts.ctx.res.header("set-cookie", sessionCookie);
  }
  if (!isAuthorized) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in" });
  }

  return opts.next({
    ctx: {
      req: opts.ctx.req,
      res: opts.ctx.res,
      uid,
    },
  });
});
