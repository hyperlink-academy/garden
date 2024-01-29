import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Env } from "..";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { isUserMember } from "../lib/isMember";

export const delete_file_upload_route = makeRoute({
  route: "delete_file_upload",
  input: z.object({
    authToken: authTokenVerifier,
    fileID: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let session = await verifyIdentity(env.env, msg.authToken);
    const supabase = createClient(env.env);
    if (!session)
      return {
        data: { success: false },
      } as const;

    let isMember = isUserMember(env, session.id);
    if (!isMember)
      return { data: { success: false, error: "user is not a member" } };
    await supabase
      .from("file_uploads")
      .update({ deleted: true })
      .eq("id", msg.fileID);

    return { data: { success: true } };
  },
});
