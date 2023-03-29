import { getCommunityByName } from "backend/fauna/resources/functions/get_community_by_name";
import { app_event } from "backend/lib/analytics";
import { internalSpaceAPI, makeRoute, privateSpaceAPI } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { Client } from "faunadb";
import { z } from "zod";
import { Env } from "..";

export const space_input = z.object({
  display_name: z.string().trim().max(64),
  start_date: z.string(),
  end_date: z.string(),
  description: z.string().max(256),
  publish_on_listings_page: z.boolean(),
  image: z
    .discriminatedUnion("filetype", [
      z.object({
        type: z.literal("file"),
        filetype: z.literal("image"),
        id: z.string(),
      }),
      z.object({
        type: z.literal("file"),
        filetype: z.literal("external_image"),
        url: z.string(),
      }),
    ])
    .optional(),
});
export const create_space_route = makeRoute({
  route: "create_space",
  input: z
    .object({
      authToken: authTokenVerifier,
    })
    .merge(space_input),
  handler: async (msg, env: Env) => {
    let fauna = new Client({
      secret: env.env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let creator = await env.storage.get("meta-creator");
    let session = await verifyIdentity(env.env, msg.authToken);

    if (!session || session.studio !== creator || !creator)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let spaceIndex =
      (await env.storage.get<number>("meta-space-created-index")) || 0;
    await env.storage.put("meta-space-created-index", spaceIndex + 1);

    //Eventually we want this to be choosable!
    let community;
    if (msg.publish_on_listings_page) {
      community = await getCommunityByName(fauna, { name: "hyperlink" });
      if (!community)
        return {
          data: { success: false, error: "no hyperlink community" },
        } as const;
    }

    let newSpace = env.env.SPACES.newUniqueId();
    let stub = env.env.SPACES.get(newSpace);

    let data = {
      spaceID: newSpace.toString(),
      name: (spaceIndex + 1).toString(),
      data: {
        ...msg,
        studio: session.username,
        community: community?.spaceID,
      },
    };

    await internalSpaceAPI(stub)("http://internal", "claim", {
      data: data.data,
      name: (spaceIndex + 1).toString(),
      ownerID: session.studio,
      ownerName: session.username,
    });

    let thisStub = env.env.SPACES.get(env.env.SPACES.idFromString(env.id));
    await privateSpaceAPI(thisStub)("http://internal", "add_space_data", {
      ...data,
      isOwner: true,
    });

    if (community) {
      let communitySpaceID = env.env.SPACES.idFromString(community.spaceID);
      let communitySpace = env.env.SPACES.get(communitySpaceID);
      await privateSpaceAPI(communitySpace)(
        "http://internal",
        "add_space_data",
        data
      );
    }
    env.poke();
    app_event(env.env, {
      event: "create_space",
      user: session.username,
      spaceID: env.id,
    });
    return { data: { success: true } } as const;
  },
});
