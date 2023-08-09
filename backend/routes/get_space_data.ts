import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
export const get_space_data_route = makeRoute({
  route: "get_space_data",
  input: z.object({ spaceID: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env, { auth: { persistSession: false } });
    let { data } = await supabase
      .from("space_data")
      .select(
        `*, owner:identity_data!space_data_owner_fkey(*), spaces_in_studios(*, studios(do_id, name))`
      )
      .eq("do_id", msg.spaceID)
      .single();

    if (!data)
      return { data: { success: false, error: "no space found" } } as const;

    return { data: { success: true, data } } as const;
  },
});

export type SpaceData = Extract<
  Awaited<ReturnType<typeof get_space_data_route.handler>>,
  { data: { success: true } }
>["data"]["data"];
