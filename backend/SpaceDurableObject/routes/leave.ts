import { app_event } from "backend/lib/analytics";
import { makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
import { Env } from "..";
import { isMember } from "../lib/isMember";

export const leave_route = makeRoute({
  route: "leave",
  input: z.object({
    authToken: authTokenVerifier,
  }),
  handler: async (msg, env: Env) => {
    let supabase = createClient(env.env);
    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    let space_type = await env.storage.get<string>("meta-space-type");

    if (!isMember(supabase, env, session.id))
      return { data: { success: true } };

    if (space_type === "studio") {
      await supabase
        .from("members_in_studios")
        .delete()
        .eq("member", session.id)
        .eq("studios.do_id", env.id);
    } else {
      await supabase
        .from("members_in_spaces")
        .delete()
        .eq("member", session.id)
        .eq("space_do_id", env.id);
    }

    env.poke();
    app_event(env.env, {
      event: "joined_space",
      user: session.username,
      spaceID: env.id,
    });
    return { data: { success: true } } as const;
  },
});
