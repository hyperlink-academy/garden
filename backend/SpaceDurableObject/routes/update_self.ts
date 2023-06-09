import { Env } from "..";
import { makeRoute } from "backend/lib/api";
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

    await supabase
      .from("space_data")
      .update({
        image: msg.data.image,
        default_space_image: msg.data.default_space_image,
        display_name: msg.data.display_name,
        description: msg.data.description,
        start_date: msg.data.start_date,
        end_date: msg.data.end_date,
      })
      .eq("do_id", env.id);

    return { data: { success: true } } as const;
  },
});
