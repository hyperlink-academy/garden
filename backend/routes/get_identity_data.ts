import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
export const get_identity_data_route = makeRoute({
  route: "get_identity_data",
  input: z.object({ name: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let { data, error } = await supabase
      .from("identity_data")
      .select(
        `*,
        members_in_spaces(
          space_data(*, owner:identity_data!space_data_owner_fkey(*))
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
