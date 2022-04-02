import { Bindings } from "backend";
import { getIdentityByUsername } from "backend/fauna/resources/functions/get_identity_by_username";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { z } from "zod";
export const get_space_route = makeRoute({
  route: "get_space",
  input: z.object({ space: z.string(), studio: z.string() }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let identity = await getIdentityByUsername(fauna, {
      username: msg.studio.toLowerCase(),
    });
    if (!identity)
      return { data: { success: false, error: "no studio found" } } as const;
    let stub = env.SPACES.get(env.SPACES.idFromString(identity.studio));
    let space = await internalSpaceAPI(stub)("http://local", "get_space", {
      space: msg.space,
    });
    if (!space.success)
      return { data: { success: false, error: "no space found" } } as const;
    return { data: { success: true, id: space.id } } as const;
  },
});
