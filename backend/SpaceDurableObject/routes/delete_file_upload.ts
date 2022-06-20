import { Bindings } from "backend";
import { z } from "zod";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { makeRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { Env } from "..";
import { deleteFileUpload } from "backend/fauna/resources/functions/delete_file_upload";

export const delete_file_upload_route = makeRoute({
  route: "delete_file_upload",
  input: z.object({
    token: z.string(),
    fileID: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let fauna = new Client({
      secret: env.env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let session = await getSessionById(fauna, { id: msg.token });
    if (!session)
      return {
        data: { success: false },
      } as const;

    if (!session) return { data: { success: false } };

    let isMember = await env.factStore.scanIndex.ave(
      "space/member",
      session.studio
    );
    if (!isMember)
      return { data: { success: false, error: "user is not a member" } };
    deleteFileUpload(fauna, { id: msg.fileID, token: msg.token });

    return { data: { success: true } };
  },
});
