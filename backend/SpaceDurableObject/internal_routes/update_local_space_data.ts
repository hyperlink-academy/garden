import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { space_input } from "../routes/create_space";

export const update_local_space_data_route = makeRoute({
  route: "update_local_space_data",
  input: z.object({
    spaceID: z.string(),
    data: space_input
      .omit({ name: true })
      .merge(
        z.object({
          deleted: z.boolean(),
        })
      )
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
        value: msg.data.image,
        positions: {},
      });
    }

    if (msg.data.start_date !== undefined && msg.data.start_date !== "") {
      await env.factStore.assertFact({
        entity: spaceEntity,
        attribute: "space/start-date",
        value: { type: "yyyy-mm-dd", value: msg.data.start_date },
        positions: {},
      });
    }

    if (msg.data.end_date !== undefined && msg.data.end_date !== "") {
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
