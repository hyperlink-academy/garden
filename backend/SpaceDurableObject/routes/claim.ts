import { makeRoute } from "backend/lib/api";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";
export const claimRoute = makeRoute({
  route: "claim",
  input: z.object({
    ownerID: z.string(),
    name: z.string(),
    ownerName: z.string(),
    image: z
      .object({
        type: z.union([z.literal("default"), z.literal("uploaded")]),
        value: z.string(),
      })
      .optional(),
  }),
  handler: async (msg, env: Env) => {
    let creator = await env.storage.get("meta-creator");
    let thisEntity = ulid();
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
        entity: thisEntity,
        attribute: "this/name",
        positions: { aev: "a0" },
        value: msg.name,
      }),
      env.factStore.assertFact({
        entity: thisEntity,
        attribute: "space/door/uploaded-image",
        value:
          msg.image?.type === "uploaded"
            ? {
                type: "file",
                filetype: "image",
                id: msg.image.value,
              }
            : {
                type: "file",
                filetype: "external_image",
                url: msg.image?.value || "/doors/door-clouds-256.jpg",
              },
        positions: {},
      }),
      env.storage.put("meta-creator", msg.ownerID),
    ]);
    return { data: { success: true } };
  },
});
