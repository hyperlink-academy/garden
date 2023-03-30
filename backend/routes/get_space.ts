import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
export const get_space_route = makeRoute({
  route: "get_space",
  input: z.object({ space: z.string(), studio: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let { data } = await supabase
      .from("identity_data")
      .select("*")
      .eq("username", msg.studio.toLowerCase())
      .single();

    if (!data)
      return { data: { success: false, error: "no studio found" } } as const;

    let stub = env.SPACES.get(env.SPACES.idFromString(data.studio));
    let space = await internalSpaceAPI(stub)("http://local", "get_space", {
      space: msg.space,
    });
    if (!space.success)
      return { data: { success: false, error: "no space found" } } as const;
    return { data: { success: true, id: space.id } } as const;
  },
});
