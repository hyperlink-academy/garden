import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Bindings } from "..";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { uuidToBase62 } from "src/uuidHelpers";
import { createClient } from "backend/lib/supabase";
import { isUserMemberByID } from "backend/SpaceDurableObject/lib/isMember";

export const get_daily_token_route = makeRoute({
  route: "get_daily_token",
  input: z.object({
    id: z.string(),
    authToken: authTokenVerifier,
  }),
  handler: async (msg, env: Bindings) => {
    let headers = {
      "Content-Type": "application/json",
      AUTHORIZATION: `Bearer ${env.DAILY_API_KEY}`,
    };

    let session = await verifyIdentity(env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    const supabase = createClient(env);

    if (!isUserMemberByID(env, session.id, msg.id)) {
      return {
        data: { success: false, error: "user is not a member" },
      } as const;
    }

    let { data } = await supabase
      .from("space_data")
      .select(`name, owner:identity_data!space_data_owner_fkey(*), id`)
      .eq("id", msg.id)
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

    return {
      data: {
        success: true,
        room,
        name,
        token: (await token.json()) as { token: string },
      },
    } as const;
  },
});
