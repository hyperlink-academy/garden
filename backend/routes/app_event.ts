import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { createClient } from "backend/lib/supabase";

export const app_event_route = makeRoute({
  route: "app_event",
  input: z.object({
    event: z.string(),
    user: z.string(),
    space_do_id: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let { data: space_id } = await supabase
      .from("space_data")
      .select("id")
      .eq("do_id", msg.space_do_id)
      .single();
    if (!space_id)
      return { data: { success: false, error: "no space found" } } as const;

    await supabase
      .from("space_events")
      .insert({ event: msg.event, user: msg.user, space_id: space_id.id });

    return { data: { success: true } } as const;
  },
});
