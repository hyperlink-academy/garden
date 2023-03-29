import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { getIdentityByUsername } from "backend/fauna/resources/functions/get_identity_by_username";
import { makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { Client } from "faunadb";
import { z } from "zod";
export const getStudioRoute = makeRoute({
  route: "get_studio",
  input: z.object({ name: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let { data } = await supabase
      .from("identity_data")
      .select("*")
      .eq("username", msg.name.toLowerCase());
    if (data?.[0]) {
      return { data: { success: true, id: data[0].studio } } as const;
    }

    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let identity = await getIdentityByUsername(fauna, {
      username: msg.name.toLowerCase(),
    });
    if (!identity) return { data: { success: false } } as const;
    return { data: { success: true, id: identity.studio } } as const;
  },
});

export const get_community_route = makeRoute({
  route: "get_community",
  input: z.object({ name: z.string() }),
  handler: async (_msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let { data: community } = await supabase
      .from("communities")
      .select("*")
      .eq("name", "hyperlink")
      .single();

    if (!community) return { data: { success: false } } as const;
    return { data: { success: true, id: community.spaceID } } as const;
  },
});
