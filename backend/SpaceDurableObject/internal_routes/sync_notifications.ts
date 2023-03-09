import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { Env } from "..";

export const sync_notifications_route = makeRoute({
  route: "sync_notifications",
  input: z.object({
    space: z.string(),
    unreads: z.number(),
  }),
  handler: async (msg, env: Env) => {
    let spaceEntity = await env.factStore.scanIndex.ave("space/id", msg.space);
    if (!spaceEntity) return { data: { success: false } };
    await env.factStore.assertFact({
      entity: spaceEntity.entity,
      attribute: "space/unread-notifications",
      value: msg.unreads,
      positions: {},
    });
    env.poke();
    return { data: {} };
  },
});
