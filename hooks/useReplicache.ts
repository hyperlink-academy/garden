import {
  Attribute,
  FilterAttributes,
  ReferenceAttributes,
  UniqueAttributes,
} from "data/Attributes";
import { Fact, ReferenceType, Schema, TimestampeType } from "data/Facts";
import { Message } from "data/Messages";
import {
  CardinalityResult,
  MutationContext,
  Mutations,
  FactInput,
} from "data/mutations";
import { createContext, useCallback, useContext, useMemo } from "react";
import {
  Puller,
  Pusher,
  ReadTransaction,
  ReadonlyJSONValue,
  Replicache,
  WriteTransaction,
} from "replicache";
import { useSubscribe } from "hooks/useSubscribe";
import { ulid } from "src/ulid";
import { useAuth } from "./useAuth";
import { UndoManager } from "@rocicorp/undo";
import { useSpaceData } from "./useSpaceData";
import { useStudioData, useStudioDataByDOID } from "./useStudioData";

export type ReplicacheMutators = {
  [k in keyof typeof Mutations]: (
    tx: WriteTransaction,
    args: Parameters<(typeof Mutations)[k]>[0]
  ) => Promise<void>;
};

export let ReplicacheContext = createContext<{
  rep: Replicache<ReplicacheMutators>;
  id: string;
  undoManager: UndoManager;
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
      messageByEntity: `${m.entity}`,
      messages: `${m.topic || "general"}-${m.ts}-${m.id}`,
    },
  };
}

export function FactWithIndexes<A extends keyof Attribute>(f: Fact<A>) {
  let indexes: {
    eav: string;
    aev: string;
    at?: string;
    ave?: string;
    vae?: string;
    feed?: string;
  } = {
    eav: `${f.entity}-${f.attribute}-${f.id}`,
    aev: `${f.attribute}-${f.entity}-${f.id}`,
  };
  if (f.schema.type === "feed_post")
    indexes.feed = `${f.attribute}-${f.value}-${f.id}`;
  if (f.schema.unique) indexes.ave = `${f.attribute}-${f.value}`;
  if (f.schema.type === "reference")
    indexes.vae = `${(f.value as ReferenceType).value}-${f.attribute}`;
  if (f.schema.type === "timestamp")
    indexes.at = `${f.attribute}-${(f.value as TimestampeType).value}-${f.id}`;
  return { ...f, indexes };
}

function makeMutators(
  dataFunc: () => {
    rep: Replicache<ReplicacheMutators>;
    undoManager: UndoManager;
  }
): ReplicacheMutators {
  let mutators: ReplicacheMutators = Object.keys(Mutations).reduce((acc, k) => {
    acc[k as keyof typeof Mutations] = async (
      tx: WriteTransaction,
      mutationArgs: any
    ) => {
      let q = scanIndex(tx);
      let context: MutationContext = {
        runOnServer: async () => {},
        scanIndex: q,
        postMessage: async (m) => {
          await tx.put(m.id, MessageWithIndexes(m));
          return { success: true };
        },
        retractFact: async (id, undoAction) => {
          let { rep, undoManager } = dataFunc();

          let existingFact = (await tx.get(id)) as
            | Fact<keyof Attribute>
            | undefined;

          console.log("retracting");
          await tx.del(id);

          if (!undoAction) {
            undoManager.add({
              undo: async () => {
                if (!existingFact) return;
                await rep.mutate.assertFact({
                  ...existingFact,
                  factID: id,
                  undoAction: true,
                } as FactInput);
              },
              redo: async () => {
                await rep.mutate.retractFact({ id, undoAction: true });
              },
            });
          }

          return;
        },
        updateFact: async (id, data, undoAction) => {
          let { rep, undoManager } = dataFunc();

          let existingFact = (await tx.get(id)) as
            | Fact<keyof Attribute>
            | undefined;
          if (!existingFact) return { success: false };

          await tx.put(
            id,
            FactWithIndexes({
              ...existingFact,
              ...data,
              positions: { ...existingFact.positions, ...data.positions },
            })
          );

          if (!undoAction) {
            undoManager.add({
              undo: async () => {
                if (!existingFact) return;
                await rep.mutate.updateFact({
                  id,
                  data: existingFact,
                  undoAction: true,
                });
              },
              redo: async () => {
                await rep.mutate.updateFact({ id, data, undoAction: true });
              },
            });
          }

          return { success: true };
        },
        retractEphemeralFact: async (_clientID, factID) => {
          await tx.del(factID);
        },
        assertEmphemeralFact: async (_clientID, fact) => {
          let schema = await getSchema(tx, fact.attribute);
          if (!schema) return { success: false, error: "no schema" };
          let lastUpdated = Date.now().toString();
          let newID: string = "";
          let existingFact: Fact<keyof Attribute> | undefined;
          if (schema.cardinality === "one") {
            existingFact = (await q.eav(fact.entity, fact.attribute)) as
              | Fact<keyof Attribute>
              | undefined;
            if (existingFact) {
              newID = existingFact.id;
            }
          }
          if (!newID) newID = fact.factID || ulid();
          let data = FactWithIndexes({
            id: newID,
            ...fact,
            positions: { ...existingFact?.positions, ...fact.positions },
            lastUpdated,
            schema,
          });
          await tx.put(newID, data);
          return { success: true };
        },
        assertFact: async (fact, undoAction) => {
          let { rep, undoManager } = dataFunc();

          let schema = await getSchema(tx, fact.attribute);
          if (!schema) return { success: false, error: "no schema" };
          let lastUpdated = Date.now().toString();
          let newID: string = "";
          let existingFact: Fact<keyof Attribute> | undefined;
          if (schema.cardinality === "one") {
            existingFact = (await q.eav(fact.entity, fact.attribute)) as
              | Fact<keyof Attribute>
              | undefined;
            if (existingFact) {
              newID = existingFact.id;
            }
          }
          if (!newID) newID = fact.factID || ulid();
          let data = FactWithIndexes({
            id: newID,
            ...fact,
            positions: { ...existingFact?.positions, ...fact.positions },
            lastUpdated,
            schema,
          });
          await tx.put(newID, data);

          if (!undoAction) {
            undoManager.add({
              undo: async () => {
                if (existingFact) {
                  let value = existingFact.value;
                  let position = existingFact.positions;

                  console.log(
                    "UNDO assert",
                    fact.entity,
                    fact.attribute,
                    value
                  );

                  await rep.mutate.assertFact({
                    entity: fact.entity,
                    attribute: fact.attribute,
                    value: value,
                    positions: position,
                    undoAction: true,
                  } as FactInput);
                } else {
                  console.log("UNDO retract", fact);

                  await rep.mutate.retractFact({ id: newID, undoAction: true });
                }
              },
              redo: async () => {
                console.log(
                  "REDO assert",
                  fact.entity,
                  fact.attribute,
                  fact.value
                );

                await rep.mutate.assertFact({
                  ...fact,
                  undoAction: true,
                } as FactInput);
              },
            });
          }

          return { success: true, factID: newID };
        },
      };
      return Mutations[k as keyof typeof Mutations](mutationArgs, context);
    };
    return acc;
  }, {} as ReplicacheMutators);

  return mutators;
}

export const makeReplicache = (args: {
  puller: Puller;
  pusher: Pusher;
  name: string;
  undoManager: UndoManager;
}) => {
  let grabData = function (): {
    rep: Replicache<ReplicacheMutators>;
    undoManager: UndoManager;
  } {
    return {
      undoManager: args.undoManager,
      rep: rep,
    };
  };

  // let [undoManager] = useState(new UndoManager());
  let rep = new Replicache({
    licenseKey: "l381074b8d5224dabaef869802421225a",
    schemaVersion: "1.0.2",
    name: args.name,
    pushDelay: 500,
    pusher: args.pusher,
    puller: args.puller,
    mutators: makeMutators(grabData),
    logLevel: "error",
    indexes: {
      eav: { jsonPointer: "/indexes/eav", allowEmpty: true },
      aev: { jsonPointer: "/indexes/aev", allowEmpty: true },
      ave: { jsonPointer: "/indexes/ave", allowEmpty: true },
      vae: { jsonPointer: "/indexes/vae", allowEmpty: true },
      at: { jsonPointer: "/indexes/at", allowEmpty: true },
      messageByEntity: {
        jsonPointer: "/indexes/messageByEntity",
        allowEmpty: true,
      },
      messages: { jsonPointer: "/indexes/messages", allowEmpty: true },
    },
  });

  return rep;
};

export const db = {
  useQuery<A extends ReadonlyJSONValue>(
    query: (tx: ReadTransaction) => Promise<A>,

    defaultValue: A,
    deps: any[]
  ) {
    return useSubscribe(query, defaultValue, deps, "query");
  },
  useTimeAttribute<
    A extends keyof FilterAttributes<{
      type: "timestamp";
      unique: any;
      cardinality: any;
    }>
  >(attribute: A, start?: string, match?: boolean): Fact<A>[] {
    return useSubscribe(
      async (tx) => {
        let results = await tx
          .scan({
            indexName: "at",
            prefix: match && start ? `${attribute}-${start}` : `${attribute}-`,
            start: start ? { key: `${attribute}-${start}` } : undefined,
          })
          .values()
          .toArray();
        return results as Fact<A>[];
      },
      [],
      [attribute, start],
      "at" + attribute + start
    );
  },
  useEntity<A extends keyof Attribute>(
    entity: string | null,
    attribute: A
  ): CardinalityResult<A> | null {
    return useSubscribe(
      async (tx) => {
        if (!entity) return null;
        let result = await scanIndex(tx).eav(entity, attribute);
        return result;
      },
      null,
      [attribute, entity],
      "eav" + entity + attribute
    );
  },
  useUniqueAttribute<A extends keyof UniqueAttributes>(
    attribute: A,
    value: string | undefined
  ) {
    return useSubscribe(
      async (tx) => {
        if (!value) return null;
        return (await scanIndex(tx).ave(attribute, value)) || null;
      },
      null,
      [attribute, value],
      "ave" + attribute + value
    );
  },
  useAttribute<A extends keyof Attribute>(
    attribute: A | null,
    entity?: string
  ) {
    return useSubscribe(
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
      [attribute, entity],
      "aev" + attribute + entity
    );
  },
  useReference<A extends keyof ReferenceAttributes>(
    entity: string | null,
    attribute?: A
  ) {
    return useSubscribe(
      async (tx) => {
        if (!entity) return [];
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
      [entity, attribute],
      "vae" + entity + attribute
    );
  },
  useMessages(topic: string) {
    return useSubscribe(
      async (tx) => {
        let messages = await tx
          .scan({ indexName: "messages", prefix: topic })
          .values()
          .toArray();
        return messages as Message[];
      },
      [],
      [topic],
      topic
    );
  },
  useMessageByEntity(entity: string | null) {
    return useSubscribe(
      async (tx) => {
        if (!entity) return null;
        let messages = await tx
          .scan({ indexName: "messageByEntity", prefix: entity })
          .values()
          .toArray();
        return messages[0] as Message;
      },
      null,
      [entity],
      "messageByEntity" + entity
    );
  },
  useMessageByID(id: string | null) {
    return useSubscribe(
      async (tx) => {
        if (!id) return null;
        let message = await tx.get(id);
        return message as Message | null;
      },
      null,
      [id],
      "messages" + id
    );
  },
};

export const useSpaceID = () => {
  return useContext(ReplicacheContext)?.id;
};

export const useMutations = () => {
  let { session } = useAuth();
  let rep = useContext(ReplicacheContext);
  let { data: spaceData } = useSpaceData(rep?.id);
  let { data: studioData } = useStudioDataByDOID(rep?.id);
  let memberEntity = useSubscribe(
    async (tx) => {
      if (!session || !session.loggedIn || !session.session?.studio)
        return null;
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
    [session.session?.studio],
    "auth"
  );
  let auth =
    session.user &&
    (spaceData?.members_in_spaces.find((m) => m.member === session.user?.id) ||
      studioData?.members_in_studios?.find(
        (m) => m.member === session.user?.id
      ));
  let permissions = useMemo(
    () => ({
      commentAndReact:
        !!memberEntity ||
        (session &&
          spaceData?.spaces_in_studios.find((s) =>
            s.studios?.members_in_studios.find(
              (m) => m.member === session.user?.id
            )
          )),
    }),
    [spaceData, session, memberEntity]
  );
  let client = useSubscribe(
    async (tx) => {
      let client = await scanIndex(tx).ave("presence/client-id", tx.clientID);
      if (!client) return null;
      return {
        clientID: client.value,
        entity: client.entity,
      };
    },
    null,
    [],
    "clientEntity"
  );

  let mutate = useCallback(
    function mutate<T extends keyof typeof Mutations>(
      mutation: T,
      args: Parameters<(typeof Mutations)[T]>[0]
    ) {
      if (!session) return;
      return rep?.rep.mutate[mutation](args);
    },
    [session, memberEntity, rep]
  );
  let action = useMemo(
    () => ({
      start() {
        rep?.undoManager.startGroup();
      },
      end() {
        rep?.undoManager.endGroup();
      },
      add(opts: {
        undo: () => Promise<void> | void;
        redo: () => Promise<void> | void;
      }) {
        rep?.undoManager.add(opts);
      },
    }),
    [rep?.undoManager]
  );

  // if (rep == null) throw "Cannot call useMutations() if not nested within a ReplicacheContext context"

  return {
    rep: rep?.rep,
    authorized: !!auth,
    memberEntity: memberEntity?.entity || null,
    client,
    mutate,
    action,
    permissions,
  };
};
