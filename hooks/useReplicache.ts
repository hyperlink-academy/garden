import {
  Attribute,
  FilterAttributes,
  ReferenceAttributes,
  UniqueAttributes,
} from "data/Attributes";
import { Fact } from "data/Facts";
import { Message } from "data/Messages";
import { CardinalityResult, Mutations } from "data/mutations";
import { createContext, useCallback, useContext, useMemo } from "react";
import { ReadTransaction, ReadonlyJSONValue } from "replicache";
import { useSubscribe } from "hooks/useSubscribe";
import { useAuth } from "./useAuth";
import { UndoManager } from "@rocicorp/undo";
import { Reflect } from "@rocicorp/reflect/client";
import { ReplicacheMutators, scanIndex } from "reflect";
export { scanIndex } from "reflect";

export let ReplicacheContext = createContext<{
  rep: Reflect<ReplicacheMutators>;
  id: string;
  undoManager: UndoManager;
} | null>(null);

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
          .scan({ prefix: `messages-${topic}` })
          .values()
          .toArray();
        return messages as Message[];
      },
      [],
      [topic],
      "messages" + topic
    );
  },
  useMessageByEntity(entity: string | null) {
    return useSubscribe(
      async (tx) => {
        if (!entity) return null;
        let messages = await tx
          .scan({ prefix: `messageBYEntity-${entity}` })
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
  let auth = useSubscribe(
    async (tx) => {
      if (!session || !session.loggedIn || !session.session?.studio)
        return null;
      let fact = (await tx
        .scan({
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
      if (!session || !auth) return;
      //@ts-ignore
      return rep?.rep.mutate[mutation](args);
    },
    [session, auth, rep]
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
    memberEntity: auth?.entity || null,
    client,
    mutate,
    action,
  };
};
