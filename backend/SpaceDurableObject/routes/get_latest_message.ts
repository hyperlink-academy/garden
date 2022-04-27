import { Env } from "backend/SpaceDurableObject";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
export const get_latest_message = makeRoute({
  route: "get_latest_message",
  input: z.object({}),
  handler: async (_msg, env: Env) => {
    let latestMessage = await env.storage.get<number>("meta-latest-message");
    return { success: true, data: { latestMessage: latestMessage || 0 } };
  },
});
