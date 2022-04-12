import { Bindings } from "backend";
import { getSignupToken } from "backend/fauna/resources/functions/get_signup_token";
import { makeRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { z } from "zod";
export const get_signup_token_route = makeRoute({
  route: "get_signup_token",
  input: z.object({ code: z.string() }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let token = await getSignupToken(fauna, {
      code: msg.code,
    });
    if (!token) return { data: { success: false } } as const;
    return { data: { success: true, signup_token: token } } as const;
  },
});
