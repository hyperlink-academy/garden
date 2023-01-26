import { makeRoute } from "backend/lib/api";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";
export const claim_as_community_route = makeRoute({
  route: "claim_as_community",
  input: z.object({
    name: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let creator = await env.storage.get("meta-creator");
    if (creator) return { data: { success: false } };
    let thisEntity = ulid();
    await Promise.all([
      env.factStore.assertFact({
        entity: thisEntity,
        attribute: "this/name",
        value: msg.name,
        positions: {},
      }),
    ]);
    await env.storage.put("meta-creator", "admin");
    return { data: { success: true } };
  },
});
