import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
export const delete_self_route = makeRoute({
  route: "delete_self",
  input: z.object({ authToken: authTokenVerifier }),
  handler: async (msg, env: Env) => {
    let session = await verifyIdentity(env.env, msg.authToken);
    const supabase = createClient(env.env);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let creator = await env.storage.get("meta-creator");
    if (!creator)
      return {
        data: { success: false, error: "space not initialized" },
      } as const;
    if (creator !== session.studio)
      return { data: { success: false } } as const;

    await supabase
      .from("file_uploads")
      .update({ deleted: true })
      .eq("space", env.id);

    //Delete the space in supabase!
    let space_type = await env.storage.get<string>("meta-space-type");
    if (space_type === "studio") {
      console.log(await supabase.from("studios").delete().eq("do_id", env.id));
    } else {
      await supabase.from("space_data").delete().eq("do_id", env.id);
    }

    //DELETING EVERYTHING
    await env.storage.deleteAll();
    return { data: { success: true } };
  },
});
