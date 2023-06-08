import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";
export const delete_self_route = makeRoute({
  route: "delete_self",
  input: z.object({ authToken: authTokenVerifier, name: z.string() }),
  handler: async (msg, env: Env) => {
    let session = await verifyIdentity(env.env, msg.authToken);
    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let creator = await env.storage.get("meta-creator");
    if (!creator) return { data: { success: false } } as const;
    if (creator !== session.studio)
      return { data: { success: false } } as const;

    await supabase
      .from("file_uploads")
      .update({ deleted: true })
      .eq("space", env.id);

    //Delete the space in supabase!
    await supabase.from("space_data").delete().eq("do_id", env.id);

    //DELETING EVERYTHING
    await env.storage.deleteAll();
    return { data: { success: true } };
  },
});
