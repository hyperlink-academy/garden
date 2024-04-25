import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Env } from "..";
import { Mutations, StudioMatePermissions } from "data/mutations";
import { store } from "../fact_store";
import { CachedStorage } from "../storage_cache";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";
import { isUserMember } from "../lib/isMember";

export type ClientGroup = {
  [k: string]: { lastMutationID: number; lastUpdated: number };
};

export const push_route = makeRoute({
  route: "push",
  input: z.object({
    authToken: authTokenVerifier,
    clientGroupID: z.string(),
    mutations: z.array(
      z.object({
        clientID: z.string(),
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
    let supabase = createClient(env.env);

    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;
    let cachedStore = new CachedStorage(env.storage);
    let fact_store = store(cachedStore, { id: env.id });

    let isMember = await isUserMember(env, session.id);

    let release = await env.pushLock.lock();
    let clientGroup =
      (await cachedStore.get<ClientGroup>(
        `clientGroup-${msg.clientGroupID}`
      )) || {};

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
        let lastMutationPerClient = msg.mutations.reduce((acc, mut) => {
          acc[mut.clientID] = {
            lastMutationID: mut.id,
            lastUpdated: Date.now(),
          };
          return acc;
        }, {} as ClientGroup);
        cachedStore.put<ClientGroup>(`clientGroup-${msg.clientGroupID}`, {
          ...clientGroup,
          ...lastMutationPerClient,
        });
        cachedStore.flush();
        release();
        return {
          data: { success: false, error: "user is not a member" },
        } as const;
      }
    }

    for (let i = 0; i < msg.mutations.length; i++) {
      let mutation = msg.mutations[i];
      let lastMutationID = clientGroup[mutation.clientID]?.lastMutationID || 0;
      if (mutation.id <= lastMutationID) continue;
      clientGroup[mutation.clientID] = {
        lastMutationID: mutation.id,
        lastUpdated: Date.now(),
      };
      let name = mutation.name as keyof typeof Mutations;
      if (!Mutations[name]) {
        continue;
      }
      if (
        !isMember &&
        isStudioMember &&
        !StudioMatePermissions.includes(name)
      ) {
        continue;
      }
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
    cachedStore.put<ClientGroup>(
      `clientGroup-${msg.clientGroupID}`,
      clientGroup
    );
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
