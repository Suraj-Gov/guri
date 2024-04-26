import { headers } from "next/headers";
import { UserProfile } from "server/src/db/models";
import { getTRPCBaseUrl } from "./env";

export const getLoggedInUser = async () => {
  // TODO figure out a way for trpc to be invoked in RSC
  try {
    const res = await fetch(`${getTRPCBaseUrl()}/user.getUser?input={}`, {
      headers: headers(),
    });
    const jsonRes = await res.json();
    const user: UserProfile = jsonRes?.result?.data;
    return user;
  } catch (err) {
    console.error("could not fetch user", err);
  }
};
