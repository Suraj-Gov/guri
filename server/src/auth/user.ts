import { usersTable, type User } from "@/db/models";
import { eq } from "drizzle-orm";
import { Scrypt, type Session } from "lucia";
import { db } from "../db";
import { Result } from "../helpers/result";
import { lucia } from "./lucia";

export const getSessionCookie = (session: Session) => {
  return lucia.createSessionCookie(session.id);
};

export type LoginData = Omit<User, "hashedPassword"> & { session: Session };

// https://lucia-auth.com/guides/email-and-password/basics
export const createUser = async (
  user: Pick<User, "email" | "name"> & { password: string }
): Promise<Result<LoginData>> => {
  const { email, name, password } = user;

  const hash = await new Scrypt().hash(password);
  try {
    const addUser = await db
      .insert(usersTable)
      .values({
        email,
        name,
        hashedPassword: hash,
      })
      .returning();

    if (!addUser[0]) {
      return Result.error("Could not create user");
    }
    const { hashedPassword: _, ...newUser } = addUser[0];

    const session = await lucia.createSession(newUser.id, { email });
    return new Result({ ...newUser, session });
  } catch (err) {
    console.error(err);
    return Result.error("Could not create user");
  }
};

export const loginUser = async (
  params: Pick<User, "email"> & { password: string }
): Promise<Result<LoginData>> => {
  const { email, password } = params;

  try {
    const userRow = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!userRow[0]) {
      return Result.error("Invalid email/password", "UNAUTHORIZED");
    }

    const { hashedPassword: hash, ...user } = userRow[0];
    const isValidPassword = await new Scrypt().verify(hash, password);
    if (!isValidPassword) {
      return Result.error("Invalid email/password", "UNAUTHORIZED");
    }

    const session = await lucia.createSession(user.id, {});
    return new Result({ ...user, session });
  } catch (err) {
    console.error(err);
    return Result.error("Invalid email/password", "INTERNAL_SERVER_ERROR");
  }
};

export const logoutUser = async (cookie: string) => {
  const sessionId = lucia.readSessionCookie(cookie) || "";
  await lucia.invalidateSession(sessionId);
  const blankCookie = lucia.createBlankSessionCookie();
  return blankCookie.serialize();
};

// https://lucia-auth.com/guides/validate-session-cookies/
export const isUserAuthorized = async (
  cookie: string
): Promise<{ isAuthorized: boolean; sessionCookie?: string; uid?: number }> => {
  const session = lucia.readSessionCookie(cookie);
  if (!session) return { isAuthorized: false };
  const validation = await lucia.validateSession(session);
  if (!validation?.session) {
    // expired, log out
    return {
      isAuthorized: false,
      sessionCookie: lucia.createBlankSessionCookie().serialize(),
    };
  }
  const uid = validation.session.userId;
  if (validation?.session?.fresh) {
    // issue fresh cookie
    const newCookie = lucia.createSessionCookie(validation.session.id);
    return {
      isAuthorized: true,
      sessionCookie: newCookie.serialize(),
      uid,
    };
  }
  return { isAuthorized: true, uid };
};
