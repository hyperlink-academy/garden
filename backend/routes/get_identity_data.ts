import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
import { query } from "./get_space_data";
export const get_identity_data_route = makeRoute({
  route: "get_identity_data",
  input: z.object({ name: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let { data, error } = await supabase
      .from("identity_data")
      .select(
        `*,
        members_in_spaces(
          space_data(${query})
        ),
        studios!studios_creator_fkey(*),
        members_in_studios(studios(*)),
        owner:space_data!space_data_owner_fkey(*, owner:identity_data!space_data_owner_fkey(*))`
      )
      .eq("username", msg.name.toLowerCase())
      .single();
    console.log(error);
    if (data) {
      return { data: { success: true, data } } as const;
    }

    return { data: { success: false } } as const;
  },
});
