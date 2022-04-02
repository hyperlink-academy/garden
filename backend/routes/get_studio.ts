import { Bindings } from "backend";
import { getIdentityByUsername } from "backend/fauna/resources/functions/get_identity_by_username";
import { makePOSTRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { z } from "zod";
export const getStudioRoute = makePOSTRoute({
  route: "get_studio",
  input: z.object({ name: z.string() }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let identity = await getIdentityByUsername(fauna, {
      username: msg.name.toLowerCase(),
    });
    if (!identity) return { data: { success: false } } as const;
    return { data: { success: true, id: identity.studio } } as const;
  },
});
