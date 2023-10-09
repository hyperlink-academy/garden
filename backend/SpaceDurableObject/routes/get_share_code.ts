import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Env } from "..";
import { generateShareCode } from "../lib/generate_share_code";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { isMember } from "../lib/isMember";

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

    if (!isMember(supabase, env, session.id))
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
