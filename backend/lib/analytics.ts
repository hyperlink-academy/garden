import { Bindings } from "backend";
import { createClient } from "./supabase";

type AppEvents =
  | "signup"
  | "create_space"
  | "joined_space"
  | "created_card"
  | "sent_message"
  | "created_room";

export const app_event = async (
  env: Bindings,
  event: { event: AppEvents; user: string; spaceID: string }
) => {
  let supabase = createClient(env);
  await supabase
    .from("space_events")
    .insert({ event: event.event, user: event.user, space: event.spaceID });
  env.APP_EVENT_ANALYTICS?.writeDataPoint({
    blobs: [event.event, event.spaceID, event.user],
    doubles: [],
    indexes: [hexToArrayBuffer(event.spaceID)],
  });
};

function hexToArrayBuffer(hex: string) {
  const view = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return view;
}
