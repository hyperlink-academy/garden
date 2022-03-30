import { z } from "zod";
import { Bindings } from "backend";
import { Client } from "faunadb";
import { makePOSTRoute } from "backend/lib/api";
import { deleteSession } from "backend/fauna/resources/functions/delete_session";

export const LogoutRoute = makePOSTRoute({
  cmd: "logout",
  input: z.object({ token: z.string() }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    await deleteSession(fauna, { id: msg.token });
    return {
      data: { loggedIn: false } as const,
    };
  },
});
