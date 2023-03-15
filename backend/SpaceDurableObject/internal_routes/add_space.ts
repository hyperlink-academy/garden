import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { ulid } from "src/ulid";
import { space_input } from "../routes/create_space";
export const add_space_data_route = makeRoute({
  route: "add_space_data",
  input: z.object({
    entityID: z.string().optional(),
    spaceID: z.string(),
    name: z.string(),
    data: space_input.merge(
      z.object({
        studio: z.string().optional(),
        community: z.string().optional(),
      })
    ),
  }),
  handler: async (msg, env: Env) => {
    let entityID = msg.entityID ? msg.entityID : ulid();

    await Promise.all([
      env.factStore.assertFact({
        entity: entityID,
        attribute: "space/name",
        value: msg.name,
        positions: {},
      }),
      env.factStore.assertFact({
        entity: entityID,
        attribute: "space/display_name",
        value: msg.data.display_name,
        positions: {},
      }),
      env.factStore.assertFact({
        entity: entityID,
        attribute: "space/description",
        value: msg.data.description,
        positions: {},
      }),
      msg.data.community
        ? env.factStore.assertFact({
            entity: entityID,
            attribute: "space/community",
            value: msg.data.community,
            positions: {},
          })
        : undefined,
      msg.data.studio
        ? env.factStore.assertFact({
            entity: entityID,
            attribute: "space/studio",
            value: msg.data.studio,
            positions: {},
          })
        : undefined,
      env.factStore.assertFact({
        entity: entityID,
        attribute: "space/id",
        value: msg.spaceID,
        positions: {},
      }),
      msg.data.start_date
        ? env.factStore.assertFact({
            entity: entityID,
            attribute: "space/start-date",
            value: { type: "yyyy-mm-dd", value: msg.data.start_date },
            positions: {},
          })
        : undefined,
      msg.data.end_date
        ? env.factStore.assertFact({
            entity: entityID,
            attribute: "space/end-date",
            value: { type: "yyyy-mm-dd", value: msg.data.end_date },
            positions: {},
          })
        : undefined,
      !msg.data.image
        ? undefined
        : env.factStore.assertFact({
            entity: entityID,
            attribute: "space/door/uploaded-image",
            value: msg.data.image,
            positions: {},
          }),
    ]);

    env.poke();
    return { data: { success: true } };
  },
});
