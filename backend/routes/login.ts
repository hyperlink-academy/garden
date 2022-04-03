import { z } from "zod";
import { Bindings } from "backend";
import { Client } from "faunadb";
import bcrypt from "bcryptjs";
import { makeRoute } from "backend/lib/api";
import { createSession } from "backend/fauna/resources/functions/create_new_session";
import { getIdentityByUsername } from "backend/fauna/resources/functions/get_identity_by_username";

const Errors = {
  noUser: "noUser",
  incorrectPassword: "incorrectPassword",
  insecureContext: "insecureContext",
} as const;

export const LoginRoute = makeRoute({
  route: "login",
  input: z.object({
    username: z.string(),
    password: z.string(),
  }),
  handler: async (msg, env: Bindings, _request: Request) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let existingUser = await getIdentityByUsername(fauna, {
      username: msg.username.toLowerCase(),
    });
    if (!existingUser)
      return { data: { success: false, error: Errors.noUser } } as const;

    let hashedPassword = await bcrypt.hash(msg.password, existingUser.salt);
    if (hashedPassword !== existingUser.hashedPassword)
      return {
        data: { success: false, error: Errors.incorrectPassword },
      } as const;
    let newToken = crypto.randomUUID?.();
    if (!newToken)
      return {
        data: { success: false, error: Errors.insecureContext },
      } as const;

    let session = await createSession(fauna, {
      username: msg.username,
      userAgent: "",
      createdAt: Date.now().toString(),
      studio: existingUser.studio,
      id: newToken,
    });
    if (!session.success)
      return { data: { success: false, error: session.error } } as const;

    return {
      data: { success: true, token: newToken, session: session.data },
    } as const;
  },
});
