import { createClient } from "./supabase";

type AppEvents =
  | "signup"
  | "create_space"
  | "joined_space"
  | "created_card"
  | "sent_message"
  | "created_room";

export const app_event = async (
  env: { SUPABASE_API_TOKEN: string; SUPABASE_URL: string },
  event: { event: AppEvents; user: string; spaceID: string }
) => {
  let supabase = createClient(env);
  await supabase
    .from("space_events")
    .insert({ event: event.event, user: event.user, space: event.spaceID });
};
