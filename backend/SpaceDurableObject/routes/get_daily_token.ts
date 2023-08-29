import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Env } from "..";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";
import { uuidToBase62 } from "src/uuidHelpers";

export const get_daily_token_route = makeRoute({
  route: "get_daily_token",
  input: z.object({
    authToken: authTokenVerifier,
  }),
  handler: async (msg, env: Env) => {
    let headers = {
      "Content-Type": "application/json",
      AUTHORIZATION: `Bearer ${env.env.DAILY_API_KEY}`,
    };

    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    let isMember = await env.factStore.scanIndex.ave(
      "space/member",
      session.studio
    );

    if (!isMember) {
      return {
        data: { success: false, error: "user is not a member" },
      } as const;
    }

    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );

    let { data } = await supabase
      .from("space_data")
      .select(`name, owner:identity_data!space_data_owner_fkey(*), id`)
      .eq("do_id", env.id)
      .single();
    if (!data) return { data: { success: false } } as const;

    let room;
    let name = uuidToBase62(data.id);
    let roomDataRequest = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
      method: "GET",
      headers,
    });

    if (roomDataRequest.status === 404) {
      let createRoomRequest = await fetch(`https://api.daily.co/v1/rooms`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          privacy: "private",
          name,
        }),
      });
      room = await createRoomRequest.json();
    } else {
      room = await roomDataRequest.json();
    }
    let token = await fetch(`https://api.daily.co/v1/meeting-tokens`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        properties: {
          room_name: name,
          exp: Date.now() / 1000 + 600,
        },
      }),
    });

    return { data: { success: true, room, name, token: await token.json() } };
  },
});
