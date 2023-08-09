import { Bindings } from "backend";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";

export const studio_input = z.object({
  name: z.string().trim().max(64),
  description: z.string().trim().max(256),
});
export const create_studio_route = makeRoute({
  route: "create_studio",
  input: z
    .object({
      authToken: authTokenVerifier,
    })
    .merge(studio_input),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let session = await verifyIdentity(env, msg.authToken);

    if (!session)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let newSpace = env.SPACES.newUniqueId();
    let stub = env.SPACES.get(newSpace);

    let { data } = await supabase
      .from("studios")
      .insert({
        do_id: newSpace.toString(),
        creator: session.id,
        name: msg.name,
      })
      .select()
      .single();
    if (!data) return { data: { success: false } } as const;
    await supabase.from("members_in_studios").insert({
      studio: data.id,
      member: session.id,
    });

    await internalSpaceAPI(stub)("http://internal", "claim", {
      type: "studio",
      ownerID: session.studio,
      ownerName: session.username,
    });

    return { data: { success: true, data } } as const;
  },
});
