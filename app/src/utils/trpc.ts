import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/src/trpc/app";

export const trpc = createTRPCReact<AppRouter>();
