import { createClient } from "@supabase/supabase-js";
import { app_event } from "backend/lib/analytics";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
import { Env } from "..";

export const space_input = z.object({
  display_name: z.string().trim().max(64),
  start_date: z.string(),
  end_date: z.string(),
  description: z.string().max(256),
  image: z.string().nullable().optional(),
  default_space_image: z.string().nullable().optional(),
});
export const create_space_route = makeRoute({
  route: "create_space",
  input: z
    .object({
      authToken: authTokenVerifier,
    })
    .merge(space_input),
  handler: async (msg, env: Env) => {
    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );
    let creator = await env.storage.get("meta-creator");
    let session = await verifyIdentity(env.env, msg.authToken);

    if (!session || session.studio !== creator || !creator)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let spaceIndex =
      (await env.storage.get<number>("meta-space-created-index")) || 0;
    await env.storage.put("meta-space-created-index", spaceIndex + 1);

    let newSpace = env.env.SPACES.newUniqueId();
    let stub = env.env.SPACES.get(newSpace);

    let { data } = await supabase
      .from("space_data")
      .insert({
        do_id: newSpace.toString(),
        name: (spaceIndex + 1).toString(),
        owner: session.id,
        display_name: msg.display_name,
        description: msg.description,
        image: msg.image,
        default_space_image: msg.default_space_image,
        start_date: msg.start_date,
        end_date: msg.end_date,
      })
      .select("*, owner:identity_data!space_data_owner_fkey(*)")
      .single();
    if (!data) return { data: { success: false } } as const;
    await supabase.from("members_in_spaces").insert({
      space_do_id: newSpace.toString(),
      member: session.id,
    });

    await internalSpaceAPI(stub)("http://internal", "claim", {
      type: "space",
      ownerID: session.studio,
      ownerName: session.username,
    });

    env.poke();
    app_event(env.env, {
      event: "create_space",
      user: session.username,
      spaceID: env.id,
    });
    return { data: { success: true, data } } as const;
  },
});
