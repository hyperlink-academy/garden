import { app_event } from "backend/lib/analytics";
import { makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";
import { createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";

export const join_route = makeRoute({
  route: "join",
  input: z.object({
    code: z.string(),
    authToken: authTokenVerifier,
  }),
  handler: async (msg, env: Env) => {
    let supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );
    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    let code = await env.storage.get<string>("meta-shareLink");
    if (code !== msg.code)
      return {
        data: { success: "false", error: "invalid share code" },
      } as const;

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
    if (space_type === "studio") {
      let { data: studio_ID } = await supabase
        .from("studios")
        .select("id")
        .eq("do_id", env.id)
        .single();
      if (!studio_ID) return { data: { success: false } };
      await supabase
        .from("members_in_studios")
        .insert({ member: session.id, studio: studio_ID.id });
    } else {
      await supabase
        .from("members_in_spaces")
        .insert({ space_do_id: env.id, member: session.id });
    }

    env.poke();
    app_event(env.env, {
      event: "joined_space",
      user: session.username,
      spaceID: env.id,
    });
    return { data: { success: true } } as const;
  },
});
