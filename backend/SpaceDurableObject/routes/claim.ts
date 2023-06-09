import { makeRoute } from "backend/lib/api";
import { flag } from "data/Facts";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";

let defaultReactions = [
  "😊",
  "😔",
  "❤️",
  "🎉",
  "🔥",
  "👀",
  "💀",
  "📌",
  "✅",
  "👍",
  "👎",
  "!!",
  "?",
];

export const claimRoute = makeRoute({
  route: "claim",
  input: z.object({
    ownerID: z.string(),
    ownerName: z.string(),
    type: z.union([z.literal("space"), z.literal("studio"), z.literal("user")]),
  }),
  handler: async (msg, env: Env) => {
    let creator = await env.storage.get("meta-creator");
    let space_type = await env.storage.get<string>("meta-space-type");
    let thisEntity = ulid();
    if (creator || space_type) return { data: { success: false } };
    let memberEntity = ulid();
    let homeEntity = ulid();
    await Promise.all([
      env.factStore.assertFact({
        entity: homeEntity,
        attribute: "home",
        value: flag(),
        positions: {},
      }),
      env.factStore.assertFact({
        entity: homeEntity,
        attribute: "room/name",
        value: "Home",
        positions: {},
      }),
      env.factStore.assertFact({
        entity: homeEntity,
        attribute: "room/type",
        value: "canvas",
        positions: {},
      }),
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "space/member",
        value: msg.ownerID,
        positions: { aev: "a0" },
      }),
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "member/name",
        value: msg.ownerName,
        positions: { aev: "a0" },
      }),
      ...defaultReactions.map((r) =>
        env.factStore.assertFact({
          entity: thisEntity,
          attribute: "space/reaction",
          value: r,
          positions: {},
        })
      ),
      env.storage.put("meta-creator", msg.ownerID),
      env.storage.put("meta-space-type", msg.type),
    ]);
    return { data: { success: true } };
  },
});
