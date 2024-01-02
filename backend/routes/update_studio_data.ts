import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";

export const update_studio_data = makeRoute({
  route: "update_studio_data",
  input: z.object({
    authToken: authTokenVerifier,
    studio_id: z.string(),
    data: z.object({
      welcome_message: z.string(),
      name: z.string(),
      description: z.string(),
    }).partial()
  }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let session = await verifyIdentity(env, msg.authToken);

    if (!session)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let { data } = await supabase
      .from("studios")
      .update(msg.data)
      .eq("id", msg.studio_id)
      .eq("creator", session.id)
      .select("*");

    return { data: { success: true, data } } as const;
  },
});
