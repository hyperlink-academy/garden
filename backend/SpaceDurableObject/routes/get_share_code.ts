import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Env } from "..";
import { generateShareCode } from "../lib/generate_share_code";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";

export const get_share_code_route = makeRoute({
  route: "get_share_code",
  input: z.object({ authToken: authTokenVerifier }),
  handler: async (msg, env: Env) => {
    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    let supabase = createClient(env.env);
    let space_type = await env.storage.get<string>("meta-space-type");
    let isMember;
    if (space_type === "studio") {
      let { data } = await supabase
        .from("members_in_studios")
        .select("member, studios!inner(do_id)")
        .eq("member", session.id)
        .eq("studios.do_id", env.id)
        .single();
      isMember = !!data;
    } else {
      let { data } = await supabase
        .from("members_in_spaces")
        .select("member")
        .eq("member", session.id)
        .eq("space_do_id", env.id)
        .single();
      isMember = !!data;
    }

    if (!isMember)
      return {
        data: { success: false, error: "user is not a member" },
      } as const;
    let code = await env.storage.get<string>("meta-shareLink");
    if (!code) {
      code = generateShareCode();
      await env.storage.put("meta-shareLink", code);
    }
    return { data: { code, success: true } } as const;
  },
});
