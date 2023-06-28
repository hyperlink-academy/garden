import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { space_input } from "./create_space";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";
import { ulid } from "src/ulid";
import { ref } from "data/Facts";
import { generateKeyBetween } from "src/fractional-indexing";

export const post_feed_route = makeRoute({
  route: "post_feed_route",
  input: z.object({
    authToken: authTokenVerifier,
    content: z.string(),
    spaceID: z.string(),
    cardEntity: z.string(),
  }),
  handler: async (msg, env: Env) => {
    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );
    let session = await verifyIdentity(env.env, msg.authToken);
    let space_type = await env.storage.get<string>("meta-space-type");
    if (space_type !== "studio")
      return { data: { success: false, error: "This is not a studio" } };
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let { data: isMember } = await supabase
      .from("members_in_studios")
      .select("member, studios!inner(do_id)")
      .eq("member", session.id)
      .eq("studios.do_id", env.id);
    if (!isMember)
      return {
        data: { success: false, error: "You are not a member of this studio" },
      } as const;

    let creator = await env.factStore.scanIndex.ave(
      "space/member",
      session.studio
    );
    if (!creator)
      return { data: { success: false, error: "no member entity found" } };

    let entity = ulid();
    await env.factStore.assertFact({
      entity,
      attribute: "post/attached-card",
      value: { space_do_id: msg.spaceID, cardEntity: msg.cardEntity },
      positions: {},
    });

    await env.factStore.assertFact({
      entity,
      attribute: "card/content",
      value: msg.content,
      positions: {},
    });

    await env.factStore.assertFact({
      entity,
      attribute: "card/created-by",
      value: ref(creator.entity),
      positions: {},
    });
    let latestPosts = await env.factStore.scanIndex.aev("feed/post");
    await env.factStore.assertFact({
      entity,
      attribute: "feed/post",
      value: generateKeyBetween(
        null,
        latestPosts.sort((a, b) => {
          let aPosition = a.value,
            bPosition = b.value;
          if (aPosition === bPosition) return a.id > b.id ? 1 : -1;
          return aPosition > bPosition ? 1 : -1;
        })[0]?.value || null
      ),
      positions: {},
    });

    env.poke();
    return { data: { success: true } } as const;
  },
});
