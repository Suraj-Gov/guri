import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";
import superjson from "superjson";
import type { AppRouter } from "../../../../server/src/trpc/app";
import { getTRPCBaseUrl } from "../env";

export const trpcProxy = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: getTRPCBaseUrl(),
      fetch: async (url, options) => {
        if (process.env.IS_BUILD === "true") {
          return fetch(url, {
            ...options,
          });
        }

        return fetch(url, {
          ...options,
          credentials: "include",
          headers: headers(),
        });
      },
    }),
  ],
});
