import { Bindings } from "backend";
import { isUserMember } from "backend/SpaceDurableObject/lib/isMember";
import { makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";

export const leave_space_route = makeRoute({
  route: "leave_space",
  input: z.object({
    do_id: z.string(),
    type: z.union([z.literal("space"), z.literal("studio")]),
    authToken: authTokenVerifier,
  }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let session = await verifyIdentity(env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    let isMember = isUserMember({ env, id: msg.do_id }, session.id);

    if (!isMember) return { data: { success: true } };

    if (msg.type === "studio") {
      await supabase
        .from("members_in_studios")
        .delete()
        .eq("member", session.id)
        .eq("studios.do_id", msg.do_id);
    } else {
      await supabase
        .from("members_in_spaces")
        .delete()
        .eq("member", session.id)
        .eq("space_do_id", msg.do_id);
    }

    return { data: { success: true } } as const;
  },
});
