import { Env } from "..";
import { makeRoute, privateSpaceAPI } from "backend/lib/api";
import { z } from "zod";
import { space_input } from "./create_space";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";

export const update_self_route = makeRoute({
  route: "update_self",
  input: z.object({
    authToken: authTokenVerifier,
    data: space_input,
  }),
  handler: async (msg, env: Env) => {
    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );
    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let creator = await env.storage.get("meta-creator");
    if (!creator) return { data: { success: false } } as const;
    if (creator !== session.studio)
      return { data: { success: false } } as const;
    let thisEntity = (await env.factStore.scanIndex.aev("this/name"))[0];
    if (!thisEntity)
      return { data: { success: false, error: "No this entity" } } as const;

    let community = await env.factStore.scanIndex.eav(
      thisEntity.entity,
      "space/community"
    );
    if (!msg.data.publish_on_listings_page && community) {
      let spaceID = env.env.SPACES.idFromString(community.value);
      let stub = env.env.SPACES.get(spaceID);
      await privateSpaceAPI(stub)(
        "http://internal",
        "update_local_space_data",
        {
          spaceID: env.id,
          data: {
            deleted: true,
          },
        }
      );
    }
    if (msg.data.publish_on_listings_page && !community) {
      let { data: communityData } = await supabase
        .from("communities")
        .select("*")
        .eq("name", "hyperlink")
        .single();
      if (!communityData)
        return {
          data: { success: false, error: "no hyperlink community" },
        } as const;
      let communitySpaceID = env.env.SPACES.idFromString(communityData.spaceID);
      let communitySpace = env.env.SPACES.get(communitySpaceID);
      await privateSpaceAPI(communitySpace)(
        "http://internal",
        "add_space_data",
        {
          spaceID: env.id,
          name: thisEntity.value,
          data: {
            studio: session.username,
            ...msg.data,
          },
        }
      );
    }

    let selfStub = env.env.SPACES.get(env.env.SPACES.idFromString(env.id));
    await privateSpaceAPI(selfStub)(
      "http://internal",
      "update_local_space_data",
      {
        spaceID: env.id,
        data: msg.data,
      }
    );

    //CALL MEMBERS
    let members = await env.factStore.scanIndex.aev("space/member");
    for (let i = 0; i < members.length; i++) {
      let spaceID = env.env.SPACES.idFromString(members[i].value);
      let stub = env.env.SPACES.get(spaceID);
      await privateSpaceAPI(stub)(
        "http://internal",
        "update_local_space_data",
        {
          spaceID: env.id,
          data: msg.data,
        }
      );
    }
    if (msg.data.publish_on_listings_page && community) {
      let spaceID = env.env.SPACES.idFromString(community.value);
      let stub = env.env.SPACES.get(spaceID);
      await privateSpaceAPI(stub)(
        "http://internal",
        "update_local_space_data",
        {
          spaceID: env.id,
          data: msg.data,
        }
      );
    }

    return { data: { success: true } } as const;
  },
});
