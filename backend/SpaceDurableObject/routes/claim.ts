import { makeRoute } from "backend/lib/api";
import { flag } from "data/Facts";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";
import { getMemberColor } from "./join";

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
    let canvasRoom = ulid();
    let collectionRoom = ulid();
    let chatRoom = ulid();

    await Promise.all([
      env.factStore.assertFact({
        entity: canvasRoom,
        attribute: "home",
        value: flag(),
        positions: {},
      }),

      env.factStore.assertFact({
        entity: canvasRoom,
        attribute: "room/name",
        value: "Canvas",
        positions: { roomList: "a0" },
      }),
      env.factStore.assertFact({
        entity: canvasRoom,
        attribute: "room/type",
        value: "canvas",
        positions: {},
      }),

      env.factStore.assertFact({
        entity: collectionRoom,
        attribute: "room/name",
        value: "Collection",
        positions: { roomList: "c1" },
      }),
      env.factStore.assertFact({
        entity: collectionRoom,
        attribute: "room/type",
        value: "collection",
        positions: {},
      }),
      env.factStore.assertFact({
        entity: chatRoom,
        attribute: "room/name",
        value: "Chat",
        positions: { roomList: "t1" },
      }),
      env.factStore.assertFact({
        entity: chatRoom,
        attribute: "room/type",
        value: "chat",
        positions: {},
      }),
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "member/color",
        value: await getMemberColor(env.factStore),
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
