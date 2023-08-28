import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
export const get_space_route = makeRoute({
  route: "get_space",
  input: z.object({ space: z.string(), studio: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);

    let { data } = await supabase
      .from("space_data")
      .select(
        "do_id, name, identity_data!space_data_owner_fkey!inner(username)"
      )
      .eq("name", msg.space)
      .eq("identity_data.username", msg.studio)
      .single();

    if (!data)
      return { data: { success: false, error: "no studio found" } } as const;

    return { data: { success: true, id: data.do_id } } as const;
  },
});
