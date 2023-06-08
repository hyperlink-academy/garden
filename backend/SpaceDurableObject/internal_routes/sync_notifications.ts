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
    let entity;
    let spaceEntity = await env.factStore.scanIndex.ave("space/id", msg.space);
    if (spaceEntity) entity = spaceEntity.entity;
    else {
      entity = ulid();
      await env.factStore.assertFact({
        entity,
        attribute: "space/id",
        value: msg.space,
        positions: {},
      });
    }
    await env.factStore.assertFact({
      entity: entity,
      attribute: "space/unread-notifications",
      value: msg.unreads,
      positions: {},
    });
    env.poke();
    return { data: {} };
  },
});
