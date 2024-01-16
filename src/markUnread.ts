import { createClient } from "backend/lib/supabase";
import { ref } from "data/Facts";
import { MutationContext } from "data/mutations";
import { getOrCreateMemberEntity } from "./getOrCreateMemberEntity";

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

  await ctx.runOnServer(async (env) => {
    let supabase = createClient(env.env);
    let { data } = await supabase
      .from("space_data")
      .select(
        "members_in_spaces(identity_data(*)), spaces_in_studios(members_in_studios(identity_data(*)))"
      )
      .eq("do_id", env.id)
      .single();
    if (!data) return;
    let members = [
      ...data.members_in_spaces,
      ...data.spaces_in_studios.flatMap((m) => m.members_in_studios),
    ].map((m) => m.identity_data as NonNullable<typeof m.identity_data>);
    for (let i = 0; i < members.length; i++) {
      let memberEntity = await getOrCreateMemberEntity(members[i], ctx);

      await ctx.assertFact({
        entity: args.entityID,
        attribute: args.attribute,
        value: ref(memberEntity),
        positions: {},
      });

      let unreads = await calculateUnreads(memberEntity, ctx);
      await supabase.from("user_space_unreads").upsert({
        user: members[i].id,
        space: env.id,
        unreads,
      });
    }
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
