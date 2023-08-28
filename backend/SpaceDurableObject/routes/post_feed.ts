import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { ulid } from "src/ulid";
import { ref } from "data/Facts";
import { generateKeyBetween } from "src/fractional-indexing";
import { createClient } from "backend/lib/supabase";

const position = z.object({ x: z.number(), y: z.number() });
export const post_feed_route = makeRoute({
  route: "post_feed_route",
  input: z.object({
    authToken: authTokenVerifier,
    cardPosition: position.optional(),
    contentPosition: position.optional(),
    content: z.string(),
    spaceID: z.string(),
    cardEntity: z.string(),
  }),
  handler: async (msg, env: Env) => {
    const supabase = createClient(env.env);
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
    if (msg.contentPosition)
      await env.factStore.assertFact({
        entity,
        attribute: "post/content/position",
        positions: {},
        value: {
          type: "position",
          x: msg.contentPosition?.x || 0,
          y: msg.contentPosition?.y || 0,
          rotation: 0,
          size: "small",
        },
      });

    if (msg.contentPosition)
      await env.factStore.assertFact({
        entity,
        attribute: "post/attached-card/position",
        positions: {},
        value: {
          type: "position",
          x: msg.cardPosition?.x || 0,
          y: msg.cardPosition?.y || 0,
          rotation: 0,
          size: "small",
        },
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
