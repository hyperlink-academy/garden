import { getMemberColor } from "backend/SpaceDurableObject/routes/join";
import { MutationContext } from "data/mutations";
import { ulid } from "./ulid";

export async function getOrCreateMemberEntity(
  session: {
    username: string;
    studio: string;
  },
  ctx: MutationContext
) {
  let member = await ctx.scanIndex.ave("member/name", session.username);
  let memberEntity: string;
  if (member) memberEntity = member.entity;
  else {
    memberEntity = ulid();
    let color = await getMemberColor(ctx);
    await Promise.all([
      ctx.assertFact({
        entity: memberEntity,
        attribute: "member/color",
        value: color,
        positions: {},
      }),
      ctx.assertFact({
        entity: memberEntity,
        attribute: "space/member",
        value: session.studio,
        positions: {},
      }),
      ctx.assertFact({
        entity: memberEntity,
        attribute: "member/name",
        value: session.username,
        positions: {},
      }),
    ]);
  }

  return memberEntity;
}
