import { Bindings } from "backend";

type AppEvents = "signup" | "create_space";
export const app_event = (
  env: Pick<Bindings, "APP_EVENT_ANALYTICS">,
  event: { event: AppEvents; user: string; spaceID: string }
) => {
  env.APP_EVENT_ANALYTICS.writeDataPoint({
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
