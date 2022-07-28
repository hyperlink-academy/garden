import { Bindings } from "backend";
import { z } from "zod";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { makeRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { Session } from "backend/fauna/resources/session_collection";
import { createSignupCode } from "backend/fauna/resources/functions/create_signup_code";
import { ulid } from "src/ulid";

export const create_signup_code_route = makeRoute({
  route: "create_signup_code",
  input: z.object({
    token: z.string(),
    message: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let session = await getSessionById(fauna, { id: msg.token });
    if (!session || !checkPermission(session))
      return {
        data: { success: false, error: "Unauthorized" },
      } as const;

    let code = await createSignupCode(fauna, {
      code: ulid(),
      message: msg.message,
    });
    if (!code.success)
      return {
        data: { success: false, error: "Code already exists" },
      } as const;
    return { data: { success: true, code: code.data.code } } as const;
  },
});

const checkPermission = (s: Session) => {
  let usernames = ["jared", "brendan", "celine"];
  return usernames.includes(s.username);
};
