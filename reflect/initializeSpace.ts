import { ulid } from "src/ulid";
import { WriteTransaction } from "@rocicorp/reflect";
import { README, README_Title, defaultReactions } from "src/content";
import { makeMutationContext } from "reflect";
import { flag, ref } from "data/Facts";

export const initializeSpace = async (tx: WriteTransaction) => {
  let thisEntity = ulid();
  let canvasRoom = ulid();
  let collectionRoom = ulid();
  let chatRoom = ulid();
  let readmeEntity = ulid();
  let readmeCardPositionFact = ulid();
  let ctx = makeMutationContext(tx);
  let homeEntity = await ctx.scanIndex.aev("home");
  if (homeEntity.length > 0) return;
  await Promise.all([
    ctx.assertFact({
      entity: canvasRoom,
      attribute: "home",
      value: flag(),
      positions: {},
    }),
    ctx.assertFact({
      entity: readmeEntity,
      attribute: "card/title",
      value: README_Title,
      positions: {},
    }),
    ctx.assertFact({
      entity: readmeEntity,
      attribute: "card/content",
      value: README.trim(),
      positions: {},
    }),
    ctx.assertFact({
      entity: canvasRoom,
      factID: readmeCardPositionFact,
      attribute: "desktop/contains",
      value: ref(readmeEntity),
      positions: {},
    }),
    ctx.assertFact({
      entity: readmeCardPositionFact,
      attribute: "card/position-in",
      value: { x: 64, y: 32, rotation: 0.2, size: "small", type: "position" },
      positions: {},
    }),

    ctx.assertFact({
      entity: canvasRoom,
      attribute: "room/name",
      value: "Canvas",
      positions: { roomList: "a0" },
    }),
    ctx.assertFact({
      entity: canvasRoom,
      attribute: "room/type",
      value: "canvas",
      positions: {},
    }),

    ctx.assertFact({
      entity: collectionRoom,
      attribute: "room/name",
      value: "Collection",
      positions: { roomList: "c1" },
    }),
    ctx.assertFact({
      entity: collectionRoom,
      attribute: "room/type",
      value: "collection",
      positions: {},
    }),
    ctx.assertFact({
      entity: chatRoom,
      attribute: "room/name",
      value: "Chat",
      positions: { roomList: "t1" },
    }),
    ctx.assertFact({
      entity: chatRoom,
      attribute: "room/type",
      value: "chat",
      positions: {},
    }),
    ...defaultReactions.map((r) =>
      ctx.assertFact({
        entity: thisEntity,
        attribute: "space/reaction",
        value: r,
        positions: {},
      })
    ),
  ]);
};
