import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
export const getStudioRoute = makeRoute({
  route: "get_studio",
  input: z.object({ name: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let { data } = await supabase
      .from("identity_data")
      .select(
        `*,
        members_in_spaces(
          space_data(*, owner:identity_data!space_data_owner_fkey(*))
        ),
        owner:space_data!space_data_owner_fkey(*, owner:identity_data!space_data_owner_fkey(*))`
      )
      .eq("username", msg.name.toLowerCase())
      .single();
    if (data) {
      return { data: { success: true, data } } as const;
    }

    return { data: { success: false } } as const;
  },
});
