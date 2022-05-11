import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { makeRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";

export const join_route = makeRoute({
  route: "join",
  input: z.object({ code: z.string(), token: z.string() }),
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

    let code = await env.storage.get<string>("meta-shareLink");
    if (code !== msg.code)
      return {
        data: { success: "false", error: "invalid share code" },
      } as const;

    let existingMember = await env.factStore.scanIndex.ave(
      "member/name",
      session.username
    );
    if (existingMember)
      return { data: { success: false, error: "Existing member" } } as const;

    let memberEntity = ulid();
    await Promise.all([
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "space/member",
        value: session.studio,
        positions: { aev: "a0" },
      }),
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "member/name",
        value: session.username,
        positions: { aev: "a0" },
      }),
    ]);
    env.poke();
    return { data: { success: true } } as const;
  },
});
