import { z } from "zod";
import { Bindings } from "backend";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { app_event } from "backend/lib/analytics";
import { createClient } from "backend/lib/supabase";

export const SignupRoute = makeRoute({
  route: "signup",
  input: z.object({
    username: z.string().min(3),
    tokens: z.object({ access_token: z.string(), refresh_token: z.string() }),
  }),
  handler: async (msg, env: Bindings) => {
    let storage: { [k: string]: any } = {};
    const admin_supabase = createClient(env);
    const user_supabase = createClient(env, {
      auth: {
        storage: {
          getItem: (key) => storage[key],
          setItem: (key, value) => {
            storage[key] = value;
          },
          removeItem: (key) => {
            delete storage[key];
          },
        },
      },
    });
    let { data: session } = await user_supabase.auth.setSession(msg.tokens);
    if (!session?.user) return { data: { success: false } } as const;

    // If the user has already been initialized, don't do it again
    if (session.user.user_metadata.username)
      return {
        data: {
          success: false,
          error: "user already initialized",
          username: session.user.user_metadata.username,
        },
      } as const;
    let username = msg.username.toLowerCase();

    let newSpaceID = env.SPACES.newUniqueId();
    // I should make a table and check that this doesn't conflict with old
    // usernames either
    const { error } = await admin_supabase.from("identity_data").insert({
      id: session.user.id,
      studio: newSpaceID.toString(),
      username,
    });

    if (error)
      return {
        data: { success: false, error: "username already exists" },
      } as const;

    await user_supabase.auth.updateUser({
      data: {
        username,
        studio: newSpaceID.toString(),
      },
    });

    let stub = env.SPACES.get(newSpaceID);
    let newSpace = internalSpaceAPI(stub);
    await newSpace("http://internal", "claim", {
      type: "user",
      ownerID: newSpaceID.toString(),
      ownerName: username,
    });
    app_event(env, {
      event: "signup",
      spaceID: newSpaceID.toString(),
      user: username,
    });
    return { data: { success: true } } as const;
  },
});
