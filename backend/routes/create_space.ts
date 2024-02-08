import { Bindings } from "backend";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
export const space_input = z.object({
  display_name: z.string().trim().max(64),
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
      .from("space_data")
      .insert({
        do_id: newSpace.toString(),
        owner: session.id,
        display_name: msg.display_name,
        description: msg.description,
        image: msg.image,
        default_space_image: msg.default_space_image,
      })
      .select("*, owner:identity_data!space_data_owner_fkey(*)")
      .single();
    if (!data) return { data: { success: false } } as const;
    await supabase.from("members_in_spaces").insert({
      space_id: data.id,
      member: session.id,
    });

    await internalSpaceAPI(stub)("http://internal", "claim", {
      type: "space",
      ownerID: session.studio,
      ownerName: session.username,
    });

    return { data: { success: true, data } } as const;
  },
});
