import { type CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { isUserAuthorized } from "../auth/user";

export const createTRPCContext = async ({
  req,
  res,
}: CreateFastifyContextOptions) => {
  const cookie = req.headers.cookie;
  const authRes = await isUserAuthorized(cookie || "");
  return { req, res, uid: authRes?.uid ?? null };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
