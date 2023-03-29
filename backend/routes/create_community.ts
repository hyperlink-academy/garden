import { Bindings } from "backend";
import { createCommunity } from "backend/fauna/resources/functions/create_new_community";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { Session } from "backend/fauna/resources/sessions/session_collection";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { Client } from "faunadb";
import { z } from "zod";
export const create_community_route = makeRoute({
  route: "create_community",
  input: z.object({ communityName: z.string(), authToken: authTokenVerifier }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let session = await verifyIdentity(env, msg.authToken);
    if (!session || !checkPermission(session))
      return {
        data: { success: false, error: "Unauthorized" },
      } as const;

    let newSpaceID = env.SPACES.newUniqueId();
    let stub = env.SPACES.get(newSpaceID);
    let newSpace = internalSpaceAPI(stub);

    let data = await createCommunity(fauna, {
      spaceID: newSpaceID.toString(),
      name: msg.communityName,
    });
    if (!data.success) return { data: { success: false } } as const;

    await newSpace("http://internal", "claim_as_community", {
      name: msg.communityName,
    });

    return { data: { success: true } } as const;
  },
});

const checkPermission = (s: { username: string }) => {
  let usernames = ["jared", "brendan", "celine"];
  return usernames.includes(s.username);
};
