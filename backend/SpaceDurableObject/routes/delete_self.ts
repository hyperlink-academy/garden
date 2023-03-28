import { Env } from "..";
import { makeRoute, privateSpaceAPI } from "backend/lib/api";
import { z } from "zod";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";
export const delete_self_route = makeRoute({
  route: "delete_self",
  input: z.object({ authToken: authTokenVerifier, name: z.string() }),
  handler: async (msg, env: Env) => {
    let session = await verifyIdentity(env.env, msg.authToken);
    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let creator = await env.storage.get("meta-creator");
    if (!creator) return { data: { success: false } } as const;
    if (creator !== session.studio)
      return { data: { success: false } } as const;

    await supabase
      .from("file_uploads")
      .update({ deleted: true })
      .eq("space", env.id);

    let members = await env.factStore.scanIndex.aev("space/member");
    let communities = await env.factStore.scanIndex.aev("space/community");
    let thingsToDeleteFrom = [...members, ...communities];
    for (let i = 0; i < thingsToDeleteFrom.length; i++) {
      let spaceID = env.env.SPACES.idFromString(thingsToDeleteFrom[i].value);
      let stub = env.env.SPACES.get(spaceID);
      await privateSpaceAPI(stub)(
        "http://internal",
        "update_local_space_data",
        {
          spaceID: env.id,
          data: { deleted: true },
        }
      );
    }
    //DELETING EVERYTHING
    await env.storage.deleteAll();
    return { data: { success: true } };
  },
});
