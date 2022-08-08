import { Env } from "..";
import { ExtractResponse, makeRoute, privateSpaceAPI } from "backend/lib/api";
import { z } from "zod";
import { Client } from "faunadb";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";

type RouteResponse = ExtractResponse<typeof update_self_route>;
export const update_self_route = makeRoute({
  route: "update_self",
  input: z.object({
    token: z.string(),
    data: z
      .object({
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
    let fauna = new Client({
      secret: env.env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let session = await getSessionById(fauna, { id: msg.token });
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let creator = await env.storage.get("meta-creator");
    if (!creator) return { data: { success: false } } as const;
    if (creator !== session.studio)
      return { data: { success: false } } as const;
    let thisEntity = (await env.factStore.scanIndex.aev("this/name"))[0];
    if (!thisEntity)
      return { data: { success: false, error: "No this entity" } } as const;

    if (msg.data.image) {
      env.factStore.assertFact({
        entity: thisEntity.entity,
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

    //CALL MEMBERS
    let members = await env.factStore.scanIndex.aev("space/member");
    for (let i = 0; i < members.length; i++) {
      let spaceID = env.env.SPACES.idFromString(members[i].value);
      let stub = env.env.SPACES.get(spaceID);
      await privateSpaceAPI(stub)(
        "http://internal",
        "update_local_space_data",
        {
          spaceID: env.id,
          data: { image: msg.data.image },
        }
      );
    }

    return { data: { success: true } } as const;
  },
});
