import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { Env } from "..";
import { ulid } from "src/ulid";

export const sync_notifications_route = makeRoute({
  route: "sync_notifications",
  input: z.object({
    space: z.string(),
    unreads: z.number(),
  }),
  handler: async (msg, env: Env) => {
    //TODO Put this into supabase
    return { data: {} };
  },
});
