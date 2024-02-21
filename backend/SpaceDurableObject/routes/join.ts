import { app_event } from "backend/lib/analytics";
import { makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
import { memberColors } from "src/colors";
import { Env } from "..";
import { webPushPayloadParser } from "pages/api/web_push";
import { sign } from "src/sign";
import { MutationContext } from "data/mutations";

export const join_route = makeRoute({
  route: "join",
  input: z.object({
    code: z.string(),
    authToken: authTokenVerifier,
    bio: z.string().optional(),
  }),
  handler: async (msg, env: Env) => {
    let supabase = createClient(env.env);
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
      let { data: space_ID } = await supabase
        .from("space_data")
        .select("id")
        .eq("do_id", env.id)
        .single();
      if (!space_ID) return { data: { success: false } };
      await supabase
        .from("members_in_spaces")
        .insert({ space_id: space_ID.id, member: session.id });
      app_event(env.env, {
        event: "joined_space",
        user: session.id,
        space_do_id: env.id,
      });
    }

    let payload: z.TypeOf<typeof webPushPayloadParser> = {
      type: "new-member",
      username: session.username,
      spaceID: env.id,
    };
    let payloadString = JSON.stringify(payload);
    fetch(`${env.env.NEXT_API_URL}/api/web_push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: payloadString,
        sig: await sign(payloadString, env.env.RPC_SECRET),
      }),
    });

    env.poke();
    env.updateLastUpdated();
    return { data: { success: true } } as const;
  },
});

export const getMemberColor = async (
  fact_store: Pick<MutationContext, "scanIndex">
) => {
  let existingMemberColors = await fact_store.scanIndex.aev("member/color");
  let color;
  let unassignedColors = memberColors.filter(
    (color) =>
      !existingMemberColors.find((memberColor) => memberColor.value === color)
  );
  if (unassignedColors.length === 0)
    color = memberColors[Math.floor(Math.random() * memberColors.length)];
  else
    color =
      unassignedColors[Math.floor(Math.random() * unassignedColors.length)];
  return color;
};
