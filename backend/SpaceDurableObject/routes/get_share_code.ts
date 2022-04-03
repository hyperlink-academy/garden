import { z } from "zod";
import { Client } from "faunadb";
import { makeRoute } from "backend/lib/api";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { Env } from "..";
import { generateShareCode } from "../lib/generate_share_code";

export const get_share_code_route = makeRoute({
  route: "get_share_code",
  input: z.object({ token: z.string() }),
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
    let isMember = await env.factStore.scanIndex.ave(
      "space/member",
      session.studio
    );
    if (!isMember)
      return {
        data: { success: false, error: "user is not a member" },
      } as const;
    let code = await env.storage.get<string>("meta-shareLink");
    if (!code) {
      code = generateShareCode();
      await env.storage.put("meta-shareLink", code);
    }
    return { data: { code } } as const;
  },
});
