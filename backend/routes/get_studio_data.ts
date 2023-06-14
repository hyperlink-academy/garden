import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
export const get_studio_data_route = makeRoute({
  route: "get_studio_data",
  input: z.object({ id: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let { data } = await supabase
      .from("studios")
      .select("*")
      .eq("id", msg.id)
      .single();
    if (data) {
      return { data: { success: true, data } } as const;
    }

    return { data: { success: false } } as const;
  },
});
