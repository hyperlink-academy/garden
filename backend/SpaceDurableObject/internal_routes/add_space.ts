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
        value: msg.data.name,
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
      env.factStore.assertFact({
        entity: entityID,
        attribute: "space/start-date",
        value: { type: "yyyy-mm-dd", value: msg.data.start_date },
        positions: {},
      }),
      env.factStore.assertFact({
        entity: entityID,
        attribute: "space/end-date",
        value: { type: "yyyy-mm-dd", value: msg.data.end_date },
        positions: {},
      }),
      !msg.data.image
        ? undefined
        : msg.data.image?.type === "uploaded"
        ? env.factStore.assertFact({
            entity: entityID,
            attribute: "space/door/uploaded-image",
            value: {
              type: "file",
              filetype: "image",
              id: msg.data.image.value,
            },
            positions: {},
          })
        : env.factStore.assertFact({
            entity: entityID,
            attribute: "space/door/image",
            value: msg.data.image?.value || "/doors/door-clouds-256.jpg",
            positions: {},
          }),
    ]);

    env.poke();
    return { data: { success: true } };
  },
});
