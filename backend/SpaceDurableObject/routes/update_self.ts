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
    await supabase
      .from("space_data")
      .update({
        image: msg.data.image?.filetype === "image" ? msg.data.image.id : null,
        default_space_image:
          msg.data.image?.filetype === "external_image"
            ? msg.data.image.url
            : null,
        display_name: msg.data.display_name,
        description: msg.data.description,
        start_date: msg.data.start_date,
        end_date: msg.data.end_date,
      })
      .eq("do_id", env.id);

    return { data: { success: true } } as const;
  },
});
