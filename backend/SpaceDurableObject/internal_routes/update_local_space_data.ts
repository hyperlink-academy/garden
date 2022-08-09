import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";

export const update_local_space_data_route = makeRoute({
  route: "update_local_space_data",
  input: z.object({
    spaceID: z.string(),
    data: z
      .object({
        deleted: z.boolean(),
        image: z
          .object({
            type: z.union([z.literal("default"), z.literal("uploaded")]),
            value: z.string(),
          })
          .optional(),
      })
      .partial(),
  }),
  handler: async (msg, env: Env) => {
    let spaceFact = await env.factStore.scanIndex.ave("space/id", msg.spaceID);
    if (!spaceFact)
      return { data: { success: false, error: "No space found" } } as const;

    if (msg.data.image) {
      await env.factStore.assertFact({
        entity: spaceFact.entity,
        attribute: "space/door/uploaded-image",
        value:
          msg.data.image.type === "uploaded"
            ? {
                type: "file",
                filetype: "image",
                id: msg.data.image.value,
              }
            : {
                type: "file",
                filetype: "external_image",
                url: msg.data.image.value,
              },
        positions: {},
      });
    }

    if (msg.data.deleted) {
      let references = await env.factStore.scanIndex.vae(spaceFact.entity);
      let facts = await env.factStore.scanIndex.eav(spaceFact.entity, null);
      await Promise.all(
        facts.concat(references).map((f) => env.factStore.retractFact(f.id))
      );
    }

    env.poke();
    return { data: { success: true } };
  },
});
