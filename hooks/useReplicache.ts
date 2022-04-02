import { Attribute, UniqueAttributes } from "data/Attributes";
import { Fact, Schema } from "data/Facts";
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

export type ReplicacheMutators = {
  [k in keyof typeof Mutations]: (
    tx: WriteTransaction,
    args: Parameters<typeof Mutations[k]>[0]
  ) => Promise<void>;
};

export let ReplicacheContext = createContext<{
  rep: Replicache<ReplicacheMutators>;
} | null>(null);

const scanIndex = (tx: ReadTransaction) => {
  const q: MutationContext["scanIndex"] = {
    eav: async (entity, attribute) => {
      let schema = Attribute[attribute as keyof Attribute];
      let results = await tx
        .scan({
          indexName: "eav",
          prefix: `${entity}-${attribute}`,
        })
        .values()
        .toArray();
      if (schema?.cardinality === "one")
        return results[0] as CardinalityResult<typeof attribute>;
      return results as CardinalityResult<typeof attribute>;
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

export function FactWithIndexes<A extends keyof Attribute>(f: Fact<A>) {
  let indexes: { eav: string; ave?: string; vae?: string; aev: string } = {
    eav: `${f.entity}-${f.attribute}-${f.id}`,
    aev: `${f.attribute}-${f.entity}-${f.id}`,
    ave: f.schema.unique ? `${f.attribute}-${f.value}` : "",
    vae: f.schema.type === `reference` ? `${f.value}-${f.attribute}` : "",
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
        await tx.del(id);
        return;
      },
      updateFact: async (id, data) => {
        let existingFact = (await tx.get(id)) as
          | Fact<keyof Attribute>
          | undefined;
        if (!existingFact) return { success: false };
        tx.put(id, { ...existingFact, ...data });
        return { success: true };
      },
      assertFact: async (fact) => {
        let schema = await getSchema(tx, fact.attribute);
        if (!schema) return { success: false };
        let newID = ulid();
        let lastUpdated = Date.now().toString();
        if (schema.cardinality === "one") {
          let existingFact = (await q.eav(fact.entity, fact.attribute)) as
            | Fact<keyof Attribute>
            | undefined;
          if (existingFact) {
            newID = existingFact.id;
          }
        }
        let data = FactWithIndexes({ id: newID, ...fact, lastUpdated, schema });
        tx.put(newID, data);
        return { success: false };
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
    name: args.name,
    pushDelay: 500,
    pusher: args.pusher,
    puller: args.puller,
    mutators: mutators,
  });
  rep.createIndex({ name: "eav", jsonPointer: "/indexes/eav" });
  rep.createIndex({ name: "aev", jsonPointer: "/indexes/aev" });
  rep.createIndex({ name: "ave", jsonPointer: "/indexes/ave" });
  rep.createIndex({ name: "vae", jsonPointer: "/indexes/vae" });
  return rep;
};

export const useIndex = {
  eav<A extends keyof Attribute>(entity: string, attribute: A) {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        let result = await scanIndex(tx).eav(entity, attribute);
        return (result as CardinalityResult<A>) || null;
      },
      null,
      [attribute, entity, rep]
    );
  },
  ave<A extends keyof UniqueAttributes>(attribute: A, value: string) {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        return (await scanIndex(tx).ave(attribute, value)) || null;
      },
      null,
      [attribute, value]
    );
  },
  aev<A extends keyof Attribute>(attribute: A, entity?: string) {
    let rep = useContext(ReplicacheContext);
    return useSubscribe(
      rep?.rep,
      async (tx) => {
        let results = await tx
          .scan({
            indexName: "aev",
            prefix: `${attribute}-${entity || ""}`,
          })
          .values()
          .toArray();
        return results as Fact<A>[];
      },
      null,
      [attribute, entity]
    );
  },
};
