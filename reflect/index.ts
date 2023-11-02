import type { ReflectServerOptions } from "@rocicorp/reflect/server";
import { Attribute } from "data/Attributes";
import { Message } from "data/Messages";
import { Fact, ReferenceType, Schema, TimestampeType } from "data/Facts";
import { CardinalityResult, MutationContext, Mutations } from "data/mutations";
import { ReadTransaction } from "replicache";
import { WriteTransaction } from "@rocicorp/reflect";
import { ulid } from "src/ulid";
import { Database } from "backend/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { authTokenVerifier } from "backend/lib/auth";
import { z } from "zod";
import { migrations } from "./migrations";

export { makeOptions as default };

export type ReplicacheMutators = {
  [k in keyof typeof Mutations]: (
    tx: WriteTransaction,
    args: Parameters<(typeof Mutations)[k]>[0]
  ) => Promise<void>;
};

export const mutators = {
  ...Object.fromEntries(
    Object.keys(Mutations).map((m) => {
      let mu = m as keyof typeof Mutations;
      return [
        mu,
        (tx: WriteTransaction, args: any) => {
          let ctx = makeMutationContext(tx);
          if (tx.auth?.userID) return Mutations[mu](args, ctx);
        },
      ];
    })
  ),
} as ReplicacheMutators;

type Auth = {
  userID: string;
  authorized: boolean;
};

function makeOptions(): ReflectServerOptions<ReplicacheMutators> {
  return {
    roomStartHandler: async (tx, roomID) => {
      let lastAppliedMigration = await tx.get<string>(
        "meta-lastAppliedMigration"
      );
      let pendingMigrations = migrations.filter(
        (m) => !lastAppliedMigration || m.date > lastAppliedMigration
      );

      if (pendingMigrations.length === 0) return;
      try {
        for (let i = 0; i < pendingMigrations.length; i++) {
          await pendingMigrations[i].run(tx, {
            roomID,
          });
        }
      } catch (e) {
        console.log("CONSTRUCTOR ERROR", e);
      }
      await tx.set(
        "meta-lastAppliedMigration",
        pendingMigrations[pendingMigrations.length - 1].date
      );
    },
    mutators,
    authHandler: async (auth_string, roomID): Promise<Auth> => {
      let auth: { authToken: { access_token: string; refresh_token: string } };
      try {
        auth = z
          .object({ authToken: authTokenVerifier })
          .parse(JSON.parse(auth_string));
      } catch (e) {
        return { userID: "unauthorized", authorized: false };
      }
      //TODO Hardcode this before pushing to prod for now
      let supabase = createClient<Database>(
        "https://epzrqdtswyqvjtketjhe.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwenJxZHRzd3lxdmp0a2V0amhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzkyNDk3NzIsImV4cCI6MTk5NDgyNTc3Mn0.yj_htmdUK7-SUOoFfXfW1-SnGzVW2ucOCZfXOR6JvBM",
        {
          auth: {
            persistSession: false,
          },
        }
      );
      let { data: session } = await supabase.auth.setSession(auth.authToken);
      let authorized = false;
      if (session.user?.id) {
        let { data } = await supabase
          .from("members_in_spaces")
          .select("member")
          .eq("member", session.user.id)
          .eq("space_do_id", roomID)
          .single();
        if (data) authorized = true;
      }
      return {
        userID: session?.user?.user_metadata?.studio || "unauthorized",
        authorized,
      };
    },
    logLevel: "debug",
    disconnectHandler: async (tx) => {
      let store = makeMutationContext(tx);
      let ephemeralFacts = await tx
        .scan({ prefix: `ephemeral-${tx.clientID}` })
        .values()
        .toArray();
      console.log(JSON.stringify(ephemeralFacts, null, 2));
      for (let fact of ephemeralFacts) {
        await store.retractEphemeralFact(
          tx.clientID,
          (fact as unknown as Fact<any>).id
        );
      }
    },
  };
}

export const scanIndex = (
  tx: ReadTransaction
): MutationContext["scanIndex"] => {
  return {
    eav: async (entity, attribute) => {
      let results = await tx
        .scan({
          prefix: `${entity}-${attribute ? `${attribute}-` : ""}`,
        })
        .values()
        .toArray();

      if (!attribute) return results as CardinalityResult<typeof attribute>;
      let schema = Attribute[attribute];
      if (schema?.cardinality === "one")
        return results[0] as CardinalityResult<typeof attribute>;
      return results as CardinalityResult<typeof attribute>;
    },
    aev: async (attribute, entity) => {
      if (!attribute) return [];
      let results = await tx
        .scan({
          prefix: `${attribute}-${entity || ""}`,
        })
        .values()
        .toArray();
      return results as Fact<typeof attribute>[];
    },

    vae: async (entity, attribute) => {
      let results = await tx
        .scan({
          prefix: `${entity}-${attribute || ""}`,
        })
        .values()
        .toArray();
      return results as Fact<Exclude<typeof attribute, undefined>>[];
    },
    ave: async (attribute, value) => {
      let results = await tx
        .scan({
          prefix: `${attribute}-${value}`,
        })
        .values()
        .toArray();
      return results[0] as Fact<typeof attribute>;
    },
  };
};
export const makeMutationContext = (tx: WriteTransaction): MutationContext => ({
  scanIndex: scanIndex(tx),
  runOnServer: async () => {},
  postMessage: async (message) => {
    let indexes = MessageIndexes(message);
    for (let key of Object.values(indexes)) {
      if (key) await tx.set(key, message);
    }
    return { success: false };
  },
  updateFact: async (id, data) => {
    let existingFact = (await tx.get(id)) as unknown as Fact<keyof Attribute>;
    if (!existingFact) return { success: false };
    let indexes = FactIndexes(existingFact, existingFact.schema);
    for (let key of Object.values(indexes)) {
      await tx.del(key);
    }
    let fact = {
      ...existingFact,
      ...data,
      lastUpdated: Date.now().toString(),
      positions: { ...existingFact.positions, ...data.positions },
    };
    let newIndexes = FactIndexes(fact, Attribute[fact.attribute]);
    for (let key of Object.values(newIndexes)) {
      await tx.set(key, fact);
    }
    return { success: true };
  },
  retractEphemeralFact: async (clientID, id) => {
    let result = await tx.get(id);
    let existingFact = result as unknown as Fact<keyof Attribute> | undefined;
    if (existingFact) {
      let indexes = FactIndexes(existingFact, existingFact.schema);
      for (let key of Object.values(indexes)) {
        await tx.del(key);
      }
      for (let key of Object.values(EphemeralIndex(existingFact, clientID))) {
        await tx.del(key);
      }
    }
  },
  assertEmphemeralFact: async (clientID, fact_input) => {
    let lastUpdated = Date.now().toString();
    let schema = Attribute[fact_input.attribute];
    let existingFact: Fact<keyof Attribute> | undefined;
    if (schema.cardinality === "one") {
      let result = await tx
        .scan({
          prefix: `${fact_input.entity}-${fact_input.attribute}`,
        })
        .values()
        .toArray();
      existingFact = result[0] as unknown as Fact<keyof Attribute> | undefined;
    }
    if (existingFact) {
      let indexes = FactIndexes(existingFact, schema);
      for (let key of Object.values(indexes)) {
        await tx.del(key);
      }
    }
    let fact = {
      id: existingFact?.id || fact_input.factID || ulid(),
      ...fact_input,
      positions: { ...existingFact?.positions, ...fact_input.positions },
      lastUpdated,
      schema,
    };
    let indexes = FactIndexes(fact, schema);
    for (let key of Object.values(indexes)) {
      await tx.set(key, fact);
    }
    for (let key of Object.values(EphemeralIndex(fact, clientID))) {
      await tx.set(key, fact);
    }

    return { success: true, factID: fact.id };
  },

  retractFact: async (id) => {
    let result = await tx.get(id);
    let existingFact = result as unknown as Fact<keyof Attribute> | undefined;
    if (existingFact) {
      let indexes = FactIndexes(existingFact, existingFact.schema);
      for (let key of Object.values(indexes)) {
        await tx.del(key);
      }
    }
  },
  assertFact: async (fact_input) => {
    let lastUpdated = Date.now().toString();
    let schema = Attribute[fact_input.attribute];
    let existingFact: Fact<keyof Attribute> | undefined;
    if (schema.cardinality === "one") {
      let result = await tx
        .scan({
          prefix: `${fact_input.entity}-${fact_input.attribute}`,
        })
        .values()
        .toArray();
      existingFact = result[0] as unknown as Fact<keyof Attribute> | undefined;
    }
    if (existingFact) {
      let indexes = FactIndexes(existingFact, schema);
      for (let key of Object.values(indexes)) {
        await tx.del(key);
      }
    }
    let fact = {
      id: existingFact?.id || fact_input.factID || ulid(),
      ...fact_input,
      positions: { ...existingFact?.positions, ...fact_input.positions },
      lastUpdated,
      schema,
    };
    let indexes = FactIndexes(fact, schema);
    for (let key of Object.values(indexes)) {
      await tx.set(key, fact);
    }
    return { success: true, factID: fact.id };
  },
  tx,
});
export function MessageIndexes(m: Message) {
  return {
    messageByEntity: m.entity ? `messageByEntity-${m.entity}` : undefined,
    messages: `messages-${m.topic || "general"}-${m.ts}-${m.id}`,
  };
}

export function FactIndexes<A extends keyof Attribute>(
  f: Fact<A>,
  schema: Schema
) {
  let indexes: {
    id: string;
    eav: string;
    aev: string;
    at?: string;
    ave?: string;
    vae?: string;
    feed?: string;
  } = {
    id: `${f.id}`,
    eav: `${f.entity}-${f.attribute}-${f.id}`,
    aev: `${f.attribute}-${f.entity}-${f.id}`,
  };
  if (schema.type === "feed_post")
    indexes.feed = `${f.attribute}-${f.value}-${f.id}`;
  if (schema.unique) indexes.ave = `${f.attribute}-${f.value}`;
  if (schema.type === "reference")
    indexes.vae = `${(f.value as ReferenceType).value}-${f.attribute}`;
  if (schema.type === "timestamp")
    indexes.at = `${f.attribute}-${(f.value as TimestampeType).value}-${f.id}`;
  return indexes;
}

function EphemeralIndex<A extends keyof Attribute>(
  f: Fact<A>,
  clientID: string
) {
  return { ephemeral: `ephemeral-${clientID}-${f.id}` };
}
