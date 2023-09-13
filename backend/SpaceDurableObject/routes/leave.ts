import { app_event } from "backend/lib/analytics";
import { makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
import { Env } from "..";

export const leave_route = makeRoute({
  route: "leave",
  input: z.object({
    authToken: authTokenVerifier,
  }),
  handler: async (msg, env: Env) => {
    let supabase = createClient(env.env);
    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    let space_type = await env.storage.get<string>("meta-space-type");
    let isMember: boolean;
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

    if (!isMember) return { data: { success: true } };
    let memberEntity = await env.factStore.scanIndex.ave(
      "member/name",
      session.username
    );
    if (!memberEntity)
      return { data: { success: false, error: "no member entity found" } };

    //Delete all facts
    let references = await env.factStore.scanIndex.vae(memberEntity.entity);
    let facts = await env.factStore.scanIndex.eav(memberEntity.entity, null);
    await Promise.all(
      facts.concat(references).map((f) => env.factStore.retractFact(f.id))
    );

    if (space_type === "studio") {
      await supabase
        .from("members_in_studios")
        .delete()
        .eq("member", session.id)
        .eq("studios.do_id", env.id);
    } else {
      await supabase
        .from("members_in_spaces")
        .delete()
        .eq("member", session.id)
        .eq("space_do_id", env.id);
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
