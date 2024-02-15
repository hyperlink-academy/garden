import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { space_input } from "./create_space";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";

export const update_space_route = makeRoute({
  route: "update_space",
  input: z.object({
    authToken: authTokenVerifier,
    space_id: z.string(),
    data: space_input.merge(z.object({ archived: z.boolean().optional() })),
  }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let session = await verifyIdentity(env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    await supabase
      .from("space_data")
      .update({
        image: msg.data.image,
        default_space_image: msg.data.default_space_image,
        display_name: msg.data.display_name,
        description: msg.data.description,
        archived: msg.data.archived,
      })
      .eq("owner", session.id)
      .eq("id", msg.space_id);

    return { data: { success: true } } as const;
  },
});
