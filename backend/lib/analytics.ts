import { createClient } from "./supabase";

type AppEvents =
  | "signup"
  | "create_space"
  | "joined_space"
  | "left_space"
  | "created_card"
  | "sent_message"
  | "created_room";

export const app_event = async (
  env: { SUPABASE_API_TOKEN: string; SUPABASE_URL: string },
  event: { event: AppEvents; user: string; space_do_id: string }
) => {
  const supabase = createClient(env);
  let { data: space_id } = await supabase
    .from("space_data")
    .select("id")
    .eq("do_id", event.space_do_id)
    .single();
  if (!space_id)
    return { data: { success: false, error: "no space found" } } as const;

  await supabase
    .from("space_events")
    .insert({ event: event.event, user: event.user, space_id: space_id.id });
};
