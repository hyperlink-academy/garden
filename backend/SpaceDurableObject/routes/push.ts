import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Env } from "..";
import { Mutations, StudioMatePermissions } from "data/mutations";
import { store } from "../fact_store";
import { CachedStorage } from "../storage_cache";
import { app_event } from "backend/lib/analytics";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { isUserMember } from "../lib/isMember";

export const push_route = makeRoute({
  route: "push",
  input: z.object({
    authToken: authTokenVerifier,
    clientID: z.string(),
    mutations: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        args: z.any(),
        timestamp: z.number(),
      })
    ),
    pushVersion: z.number(),
    schemaVersion: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let lastMutationID =
      (await env.storage.get<number>(`lastMutationID-${msg.clientID}`)) || 0;
    let supabase = createClient(env.env);

    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let cachedStore = new CachedStorage(env.storage);
    let fact_store = store(cachedStore, { id: env.id });

    let isMember = isUserMember(env, session.id);

    let isStudioMember = false;
    if (!isMember) {
      let { data } = await supabase
        .from("space_data")
        .select(
          "do_id, spaces_in_studios!inner(studios!inner(members_in_studios!inner(member)))"
        )
        .eq("do_id", env.id)
        .eq("spaces_in_studios.studios.members_in_studios.member", session.id)
        .single();
      isStudioMember = !!data;
      if (!isStudioMember) {
        env.storage.put<number>(
          `lastMutationID-${msg.clientID}`,
          msg.mutations[msg.mutations.length - 1].id
        );
        return {
          data: { success: false, error: "user is not a member" },
        } as const;
      }
    }

    let release = await env.pushLock.lock();

    for (let i = 0; i < msg.mutations.length; i++) {
      let mutation = msg.mutations[i];
      if (mutation.id <= lastMutationID) continue;
      lastMutationID = mutation.id;
      let name = mutation.name as keyof typeof Mutations;
      if (name === "createCard") {
        app_event(env.env, {
          event: "created_card",
          spaceID: env.id,
          user: session.username,
        });
      }

      if (!Mutations[name]) {
        continue;
      }
      if (!isMember && isStudioMember && !StudioMatePermissions.includes(name))
        continue;
      try {
        await Mutations[name](mutation.args, {
          ...fact_store,
          runOnServer: (fn) =>
            fn({ ...env, factStore: fact_store }, session?.id as string),
        });
      } catch (e) {
        console.log(
          `Error occured while running mutation: ${name}`,
          JSON.stringify(e)
        );
      }
    }
    cachedStore.put<number>(`lastMutationID-${msg.clientID}`, lastMutationID);
    await cachedStore.flush();
    release();

    env.poke();
    if (
      msg.mutations.filter((m) => !EphemeralMutations.includes(m.name as any))
        .length > 0
    )
      env.updateLastUpdated();

    return { data: { success: true, errors: [] } };
  },
});

// We need to filter these out to prevent updating lastUpdated just when a
// client connects and such
const EphemeralMutations: Array<keyof typeof Mutations> = [
  "assertEmphemeralFact",
  "initializeClient",
  "setClientInCall",
];
