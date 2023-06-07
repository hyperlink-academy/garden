import { createClient } from "@supabase/supabase-js";
import { app_event } from "backend/lib/analytics";
import { internalSpaceAPI, makeRoute, privateSpaceAPI } from "backend/lib/api";
import { verifyIdentity, authTokenVerifier } from "backend/lib/auth";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
import { Env } from "..";

export const space_input = z.object({
  display_name: z.string().trim().max(64),
  start_date: z.string(),
  end_date: z.string(),
  description: z.string().max(256),
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
    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );
    let creator = await env.storage.get("meta-creator");
    let session = await verifyIdentity(env.env, msg.authToken);

    if (!session || session.studio !== creator || !creator)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let spaceIndex =
      (await env.storage.get<number>("meta-space-created-index")) || 0;
    await env.storage.put("meta-space-created-index", spaceIndex + 1);

    let newSpace = env.env.SPACES.newUniqueId();
    let stub = env.env.SPACES.get(newSpace);

    let data = {
      spaceID: newSpace.toString(),
      name: (spaceIndex + 1).toString(),
      data: {
        ...msg,
        studio: session.username,
      },
    };

    await internalSpaceAPI(stub)("http://internal", "claim", {
      data: data.data,
      name: (spaceIndex + 1).toString(),
      ownerID: session.studio,
      ownerName: session.username,
    });

    await supabase.from("space_data").insert({
      do_id: newSpace.toString(),
      owner: session.id,
      display_name: msg.display_name,
      description: msg.description,
      image: msg.image?.filetype === "image" ? msg.image.id : null,
      default_space_image:
        msg.image?.filetype === "external_image" ? msg.image.url : null,
      start_date: msg.start_date,
      end_date: msg.end_date,
    });

    let thisStub = env.env.SPACES.get(env.env.SPACES.idFromString(env.id));
    await privateSpaceAPI(thisStub)("http://internal", "add_space_data", {
      ...data,
      isOwner: true,
    });

    env.poke();
    app_event(env.env, {
      event: "create_space",
      user: session.username,
      spaceID: env.id,
    });
    return { data: { success: true } } as const;
  },
});
