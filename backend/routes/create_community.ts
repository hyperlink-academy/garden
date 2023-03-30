import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
export const create_community_route = makeRoute({
  route: "create_community",
  input: z.object({ communityName: z.string(), authToken: authTokenVerifier }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let session = await verifyIdentity(env, msg.authToken);
    if (!session || !checkPermission(session))
      return {
        data: { success: false, error: "Unauthorized" },
      } as const;

    let newSpaceID = env.SPACES.newUniqueId();
    let stub = env.SPACES.get(newSpaceID);
    let newSpace = internalSpaceAPI(stub);

    let { error } = await supabase.from("communities").insert({
      spaceID: newSpaceID.toString(),
      name: msg.communityName,
    });
    if (error) return { data: { success: false } } as const;

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
