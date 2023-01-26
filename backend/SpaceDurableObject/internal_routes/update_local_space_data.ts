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
        completed: z.boolean(),
        start_date: z.string(),
        end_date: z.string(),
        description: z.string(),
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
    let spaceEntity = (
      await env.factStore.scanIndex.ave("space/id", msg.spaceID)
    )?.entity;
    if (!spaceEntity) {
      if (msg.spaceID === env.id) {
        spaceEntity = (await env.factStore.scanIndex.aev("this/name"))[0]
          ?.entity;
      } else
        return { data: { success: false, error: "No space found" } } as const;
    }

    if (msg.data.image) {
      await env.factStore.assertFact({
        entity: spaceEntity,
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

    if (msg.data.completed !== undefined) {
      await env.factStore.assertFact({
        entity: spaceEntity,
        attribute: "space/completed",
        value: msg.data.completed,
        positions: {},
      });
    }

    if (msg.data.start_date !== undefined) {
      await env.factStore.assertFact({
        entity: spaceEntity,
        attribute: "space/start-date",
        value: { type: "yyyy-mm-dd", value: msg.data.start_date },
        positions: {},
      });
    }

    if (msg.data.end_date !== undefined) {
      await env.factStore.assertFact({
        entity: spaceEntity,
        attribute: "space/end-date",
        value: { type: "yyyy-mm-dd", value: msg.data.end_date },
        positions: {},
      });
    }

    if (msg.data.description !== undefined) {
      await env.factStore.assertFact({
        entity: spaceEntity,
        attribute: "space/description",
        value: msg.data.description,
        positions: {},
      });
    }

    //ACTUALLY DELETES ALL THE DATA
    if (msg.data.deleted) {
      let references = await env.factStore.scanIndex.vae(spaceEntity);
      let facts = await env.factStore.scanIndex.eav(spaceEntity, null);
      await Promise.all(
        facts.concat(references).map((f) => env.factStore.retractFact(f.id))
      );
    }

    env.poke();
    return { data: { success: true } };
  },
});
