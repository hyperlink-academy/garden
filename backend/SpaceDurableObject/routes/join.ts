import { app_event } from "backend/lib/analytics";
import { makeRoute } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { ulid } from "src/ulid";
import { z } from "zod";
import { memberColors } from "src/colors";
import { Env } from "..";
import { store } from "../fact_store";
import { webPushPayloadParser } from "pages/api/web_push";
import { sign } from "src/sign";
import { MutationContext } from "data/mutations";

export const join_route = makeRoute({
  route: "join",
  input: z.object({
    code: z.string(),
    authToken: authTokenVerifier,
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

    let color = await getMemberColor(env.factStore);
    let memberEntity = ulid();
    console.log("creating members");
    console.log(
      await Promise.all([
        env.factStore.assertFact({
          entity: memberEntity,
          attribute: "member/color",
          value: color,
          positions: {},
        }),
        env.factStore.assertFact({
          entity: memberEntity,
          attribute: "space/member",
          value: session.studio,
          positions: {},
        }),
        env.factStore.assertFact({
          entity: memberEntity,
          attribute: "member/name",
          value: session.username,
          positions: {},
        }),
      ])
    );
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
    app_event(env.env, {
      event: "joined_space",
      user: session.username,
      spaceID: env.id,
    });
    return { data: { success: true } } as const;
  },
});

export const getMemberColor = async (fact_store: MutationContext) => {
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
