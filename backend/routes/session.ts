import { Bindings } from "backend";
import { z } from "zod";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { ExtractResponse, makePOSTRoute } from "backend/lib/api";
import { Client } from "faunadb";

export type SessionResponse = ExtractResponse<typeof SessionRoute>;
export const SessionRoute = makePOSTRoute({
  route: "session",
  input: z.object({
    token: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let session = await getSessionById(fauna, { id: msg.token });
    if (!session)
      return {
        data: { loggedIn: false },
      } as const;
    return { data: { loggedIn: true, session } } as const;
  },
});
