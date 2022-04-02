import { makePOSTRoute } from "backend/lib/api";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";
export const claimRoute = makePOSTRoute({
  route: "claim",
  input: z.object({
    ownerID: z.string(),
    name: z.string(),
    ownerName: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let creator = await env.storage.get("meta-creator");
    if (creator) return { data: { success: false } };
    let memberEntity = ulid();
    await Promise.all([
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
      env.factStore.assertFact({
        entity: ulid(),
        attribute: "this/name",
        positions: { aev: "a0" },
        value: msg.name,
      }),
      env.storage.put("meta-creator", msg.ownerID),
    ]);
    return { data: { success: true } };
  },
});
