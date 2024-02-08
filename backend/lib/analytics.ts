import { Bindings } from "backend";
import { internalWorkerAPI } from "./api";

type AppEvents =
  | "signup"
  | "create_space"
  | "joined_space"
  | "left_space"
  | "created_card"
  | "sent_message"
  | "created_room";

export const app_event = async (
  env: Bindings,
  event: { event: AppEvents; user: string; space_do_id: string }
) => {
  internalWorkerAPI(env)("http://internal/v0", "app_event", event);
};
