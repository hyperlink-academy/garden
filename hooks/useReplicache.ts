import { latestMigration } from "backend/SpaceDurableObject/migrations";
import {
  Attribute,
  FilterAttributes,
  ReferenceAttributes,
  UniqueAttributes,
} from "data/Attributes";
import { Fact, ReferenceType, Schema, TimestampeType } from "data/Facts";
import { Message } from "data/Messages";
import { CardinalityResult, MutationContext, Mutations } from "data/mutations";
import { createContext, useContext } from "react";
import {
  Puller,
  Pusher,
  ReadTransaction,
  Replicache,
  WriteTransaction,
} from "replicache";
import { useSubscribe } from "replicache-react";
import { ulid } from "src/ulid";
import { useAuth } from "./useAuth";

export type ReplicacheMutators = {
  [k in keyof typeof Mutations]: (
    tx: WriteTransaction,
    args: Parameters<typeof Mutations[k]>[0]
  ) => Promise<void>;
};

export let ReplicacheContext = createContext<{
  rep: Replicache<ReplicacheMutators>;
  id: string;
} | null>(null);

export const scanIndex = (tx: ReadTransaction) => {
  const q: MutationContext["scanIndex"] = {
    aev: async (attribute, entity) => {
      if (!attribute) return [];
      let results = await tx
        .scan({
          indexName: "aev",
          prefix: `${attribute}-${entity || ""}`,
        })
        .values()
        .toArray();
      return results as Fact<typeof attribute>[];
    },
    eav: async (entity, attribute) => {
      let results = await tx
        .scan({
          indexName: "eav",
          prefix: `${entity}-${attribute ? `${attribute}-` : ""}`,
        })
        .values()
        .toArray();

      if (!attribute) return results as CardinalityResult<typeof attribute>;
      let schema = await getSchema(tx, attribute);
      if (schema?.cardinality === "one")
        return results[0] as CardinalityResult<typeof attribute>;
      return results as CardinalityResult<typeof attribute>;
    },
    vae: async (entity, attribute) => {
      let results = await tx
        .scan({
          indexName: "vae",
          prefix: `${entity}-${attribute || ""}`,
        })
        .values()
        .toArray();
      return results as Fact<Exclude<typeof attribute, undefined>>[];
    },
    ave: async (attribute, value) => {
      let results = await tx
        .scan({
          indexName: "ave",
          prefix: `${attribute}-${value}`,
        })
        .values()
        .toArray();
      return results[0] as Fact<typeof attribute>;
    },
  };
  return q;
};
const getSchema = async (tx: ReadTransaction, attributeName: string) => {
  let defaultAttr = Attribute[attributeName as keyof Attribute];
  if (defaultAttr) return defaultAttr;
  let q = scanIndex(tx);
  let attribute = await q.ave("name", attributeName);
  if (!attribute) return;

  let schema: Schema = {
    type: (await q.eav(attribute.entity, "type"))?.value || "string",
    unique: (await q.eav(attribute.entity, "unique"))?.value || false,
    cardinality: (await q.eav(attribute.entity, "cardinality"))?.value || "one",
  };
  return schema;
};

export function MessageWithIndexes(m: Message) {
  return {
    ...m,
    indexes: {
      messages: `${m.topic || "general"}-${m.ts}-${m.id}`,
    },
  };
}

export function FactWithIndexes<A extends keyof Attribute>(f: Fact<A>) {
  let indexes = {
    at:
      f.schema.type === `timestamp`
        ? `${f.attribute}-${(f.value as TimestampeType).value}`
        : undefined,
    eav: `${f.entity}-${f.attribute}-${f.id}`,
    aev: `${f.attribute}-${f.entity}-${f.id}`,
    ave: f.schema.unique ? `${f.attribute}-${f.value}` : undefined,
    vae:
      f.schema.type === `reference`
        ? `${(f.value as ReferenceType).value}-${f.attribute}`
        : undefined,
  };
  return { ...f, indexes };
}

let mutators: ReplicacheMutators = Object.keys(Mutations).reduce((acc, k) => {
  acc[k as keyof typeof Mutations] = async (
    tx: WriteTransaction,
    mutationArgs: any
  ) => {
    let q = scanIndex(tx);
    let context: MutationContext = {
      scanIndex: q,
      retractFact: async (id) => {
        console.log("retracting");
        await tx.del(id);
        return;
      },
      postMessage: async (m) => {
        await tx.put(m.id, MessageWithIndexes(m));
        return { success: true };
      },
      updateFact: async (id, data) => {
        let existingFact = (await tx.get(id)) as
          | Fact<keyof Attribute>
          | undefined;
        if (!existingFact) return { success: false };
        await tx.put(id, {
          ...existingFact,
          ...data,
          positions: { ...existingFact.positions, ...data.positions },
        });
        return { success: true };
      },
      assertFact: async (fact) => {
        let schema = await getSchema(tx, fact.attribute);
        if (!schema) return { success: false, error: "no schema" };
        let lastUpdated = Date.now().toString();
        let newID;
        if (schema.cardinality === "one") {
          let existingFact = (await q.eav(fact.entity, fact.attribute)) as
            | Fact<keyof Attribute>
            | undefined;
          if (existingFact) {
            newID = existingFact.id;
          }
        }
        if (!newID) newID = ulid();
        let data = FactWithIndexes({ id: newID, ...fact, lastUpdated, schema });
        await tx.put(newID, data);
        return { success: true, factID: newID };
      },
    };
    return Mutations[k as keyof typeof Mutations](mutationArgs, context);
  };
  return acc;
}, {} as ReplicacheMutators);

export const makeReplicache = (args: {
  puller: Puller;
  pusher: Pusher;
  name: string;
}) => {
  let rep = new Replicache({
    licenseKey: "l381074b8d5224dabaef869802421225a",
    schemaVersion: latestMigration,
    name: args.name,
    pushDelay: 500,
    pusher: args.pusher,
    puller: args.puller,
    mutators: mutators,
    logLevel: "error",
  });
  rep.createIndex({ name: "eav", jsonPointer: "/indexes/eav" });
  rep.createIndex({ name: "aev", jsonPointer: "/indexes/aev" });
  rep.createIndex({ name: "ave", jsonPointer: "/indexes/ave" });
  rep.createIndex({ name: "vae", jsonPointer: "/indexes/vae" });
  rep.createIndex({ name: "at", jsonPointer: "/indexes/at" });
  rep.createIndex({ name: "messages", jsonPointer: "/indexes/messages" });
  return rep;
};

export const useIndex = {
  at<
    A extends keyof FilterAttributes<{
      type: "timestamp";
      unique: any;
      cardinality: any;
    }>
  >(attribute: A, start?: number): Fact<A>[] {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        let results = await tx
          .scan({
            indexName: "at",
            prefix: `${attribute}-`,
            start: start ? { key: `${attribute}-${start}` } : undefined,
          })
          .values()
          .toArray();
        return results as Fact<A>[];
      },
      [],
      [attribute, rep, start]
    );
  },
  eav<A extends keyof Attribute>(
    entity: string | null,
    attribute: A
  ): CardinalityResult<A> | null {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        if (!entity) return null;
        let result = await scanIndex(tx).eav(entity, attribute);
        return (result as CardinalityResult<A>) || null;
      },
      null,
      [attribute, rep, entity]
    );
  },
  ave<A extends keyof UniqueAttributes>(
    attribute: A,
    value: string | undefined
  ) {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        if (!value) return null;
        return (await scanIndex(tx).ave(attribute, value)) || null;
      },
      null,
      [attribute, value]
    );
  },
  aev<A extends keyof Attribute>(attribute: A | null, entity?: string) {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        if (!attribute) return [];
        let results = await tx
          .scan({
            indexName: "aev",
            prefix: `${attribute}-${entity || ""}`,
          })
          .values()
          .toArray();
        return results as Fact<A>[];
      },
      [],
      [attribute, entity]
    );
  },
  vae<A extends keyof ReferenceAttributes>(entity: string, attribute?: A) {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        let results = await tx
          .scan({
            indexName: "vae",
            prefix: `${entity}-${attribute || ""}`,
          })
          .values()
          .toArray();
        return results as Fact<A>[];
      },
      [],
      [entity, attribute]
    );
  },
  messages(topic: string) {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        let messages = await tx
          .scan({ indexName: "messages", prefix: topic })
          .values()
          .toArray();
        return messages as Message[];
      },
      [],
      []
    );
  },
};

export const useSpaceID = () => {
  return useContext(ReplicacheContext)?.id;
};

export const useMutations = () => {
  let { session } = useAuth();
  let rep = useContext(ReplicacheContext);
  let auth = useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!session || !session.loggedIn) return null;
      let fact = (await tx
        .scan({
          indexName: "ave",
          prefix: `space/member-${session.session.studio}`,
        })
        .values()
        .toArray()) as Fact<"space/member">[];
      if (!fact[0]) return null;
      return fact[0];
    },
    null,
    [session.session?.studio]
  );

  return {
    authorized: !!auth,
    memberEntity: auth?.entity || null,
    mutate<T extends keyof typeof Mutations>(
      mutation: T,
      args: Parameters<typeof Mutations[T]>[0]
    ) {
      if (!session || !auth) return;
      return rep?.rep.mutate[mutation](args);
    },
  };
};
