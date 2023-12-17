import { ref } from "data/Facts";
import { MutationContext } from "data/mutations";
import { createClient } from "backend/lib/supabase";

export const markUnread = async (
  args: {
    entityID: string;
    memberEntity: string;
    attribute: "discussion/unread-by" | "card/unread-by";
  },
  ctx: MutationContext
) => {
  let members = (await ctx.scanIndex.aev("space/member")).filter(
    (f) => f.entity !== args.memberEntity
  );

  for (let m of members) {
    await ctx.assertFact({
      entity: args.entityID,
      attribute: args.attribute,
      value: ref(m.entity),
      positions: {},
    });
  }

  await ctx.runOnServer(async ({ id, env }) => {
    let supabase = createClient(env);
    await supabase.from("user_space_unreads").upsert(
      await Promise.all(
        members.map(async (m) => {
          let unreads = await calculateUnreads(m.entity, ctx);
          return {
            user: m.value,
            space: id,
            unreads,
          };
        })
      )
    );
  });
};

export async function calculateUnreads(
  memberEntity: string,
  ctx: MutationContext
) {
  let count = 0;
  let unreadDiscussions = await ctx.scanIndex.vae(
    memberEntity,
    "discussion/unread-by"
  );
  let unreadCards = await ctx.scanIndex.vae(memberEntity, "card/unread-by");

  for (let card of unreadCards) {
    let inRooms = await ctx.scanIndex.vae(card.entity, "desktop/contains");
    if (inRooms.length > 0) count++;
  }
  for (let discussion of unreadDiscussions) {
    let inRooms = await ctx.scanIndex.vae(
      discussion.entity,
      "desktop/contains"
    );
    let isRoom = await ctx.scanIndex.eav(discussion.entity, "room/name");
    if (inRooms.length > 0 || isRoom) count++;
  }
  return count;
}
