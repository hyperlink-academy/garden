import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";

export const add_space_to_studio = makeRoute({
  route: "add_space_to_studio",
  input: z.object({
    authToken: authTokenVerifier,
    studio_id: z.string(),
    space_do_id: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let session = await verifyIdentity(env, msg.authToken);

    if (!session)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let { data: isMember } = await supabase
      .from("members_in_studios")
      .select()
      .eq("member", session.id)
      .eq("studio", msg.studio_id)
      .single();
    if (!isMember)
      return {
        data: { success: false, error: "user is not a member of studio" },
      };
    let { data } = await supabase
      .from("spaces_in_studios")
      .insert({
        studio: msg.studio_id,
        space: msg.space_do_id,
      })
      .select("*");

    return { data: { success: true, data } } as const;
  },
});
