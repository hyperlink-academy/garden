import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
export const get_space_data_route = makeRoute({
  route: "get_space_data",
  input: z.object({ spaceID: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN,
      { auth: { persistSession: false } }
    );
    let { data } = await supabase
      .from("space_data")
      .select(`*, owner:identity_data!space_data_owner_fkey(*)`)
      .eq("do_id", msg.spaceID)
      .single();

    if (!data)
      return { data: { success: false, error: "no space found" } } as const;

    return { data: { success: true, data } } as const;
  },
});
