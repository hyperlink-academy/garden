import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { Database } from "backend/lib/database.types";
import { z } from "zod";

export const update_studio_data = makeRoute({
  route: "update_studio_data",
  input: z.object({
    authToken: authTokenVerifier,
    studio_id: z.string(),
    name: z.string(),
    description: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let session = await verifyIdentity(env, msg.authToken);

    if (!session)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let { data } = await supabase
      .from("studios")
      .update({
        name: msg.name,
        description: msg.description,
      })
      .eq("id", msg.studio_id)
      .eq("creator", session.id)
      .select("*");

    return { data: { success: true, data } } as const;
  },
});
