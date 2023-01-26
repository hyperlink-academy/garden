import { Env } from "..";
import { makeRoute, privateSpaceAPI } from "backend/lib/api";
import { z } from "zod";
import { Client } from "faunadb";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { deleteFileUploadBySpace } from "backend/fauna/resources/functions/delete_space_uploads";
export const delete_self_route = makeRoute({
  route: "delete_self",
  input: z.object({ token: z.string(), name: z.string() }),
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

    await deleteFileUploadBySpace(fauna, {
      spaceID: env.id,
      token: msg.token,
    });

    let members = await env.factStore.scanIndex.aev("space/member");
    for (let i = 0; i < members.length; i++) {
      let spaceID = env.env.SPACES.idFromString(members[i].value);
      let stub = env.env.SPACES.get(spaceID);
      await privateSpaceAPI(stub)(
        "http://internal",
        "update_local_space_data",
        {
          spaceID: env.id,
          data: { deleted: true },
        }
      );
    }
    //TODO delete from community

    //DELETING EVERYTHING
    await env.storage.deleteAll();
    return { data: { success: true } };
  },
});
