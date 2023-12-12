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
      .select(space_data_query)
      .eq("do_id", msg.spaceID)
      .single();

    if (!data)
      return { data: { success: false, error: "no space found" } } as const;

    return { data: { success: true, data } } as const;
  },
});

export const get_space_data_by_name_route = makeRoute({
  route: "get_space_data_by_name",
  input: z.object({ username: z.string(), spaceName: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env, { auth: { persistSession: false } });
    let { data } = await supabase
      .from("space_data")
      .select(space_data_query)
      .eq("owner.username", msg.username)
      .eq("name", msg.spaceName)
      .single();

    if (!data)
      return { data: { success: false, error: "no space found" } } as const;

    return { data: { success: true, data } } as const;
  },
});

export const get_space_data_by_id_route = makeRoute({
  route: "get_space_data_by_id",
  input: z.object({ id: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env, { auth: { persistSession: false } });
    let { data } = await supabase
      .from("space_data")
      .select(space_data_query)
      .eq("id", msg.id)
      .single();

    if (!data)
      return { data: { success: false, error: "no space found" } } as const;

    return { data: { success: true, data } } as const;
  },

})

export const space_data_query = `*,
  owner:identity_data!space_data_owner_fkey!inner(*),
  spaces_in_studios(*, studios(do_id, name)),
  members_in_spaces(*)
` as const;

export type SpaceData = Extract<
  Awaited<ReturnType<typeof get_space_data_route.handler>>,
  { data: { success: true } }
>["data"]["data"];
