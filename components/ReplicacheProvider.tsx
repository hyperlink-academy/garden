"use client";
import { spaceAPI } from "backend/lib/api";
import {
  FactWithIndexes,
  makeReplicache,
  MessageWithIndexes,
  ReplicacheContext,
} from "hooks/useReplicache";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "hooks/useAuth";
import { UndoManager } from "@rocicorp/undo";
import { authToken } from "backend/lib/auth";
import { atom } from "jotai";
import { supabaseBrowserClient } from "supabase/clients";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const usePresenceState = create(() => ({
  clientIDs: [] as string[],
}));

export const useConnectedClientIDs = () => usePresenceState((s) => s.clientIDs);

export const SpaceProvider = (props: {
  children: React.ReactNode;
  id: string;
  data:
    | { space_id: string; studio_id: undefined }
    | { studio_id: string; space_id: undefined };
}) => {
  let [undoManager] = useState(new UndoManager());

  useEffect(() => {
    let handler = (e: KeyboardEvent) => {
      if (
        (e.key === "z" && e.ctrlKey) ||
        (e.key === "z" && e.metaKey && !e.shiftKey)
      ) {
        e.preventDefault();
        undoManager.undo();
      }
      if (
        (e.key === "y" && e.ctrlKey) ||
        (e.key === "Z" && e.ctrlKey) ||
        (e.key === "z" && e.metaKey && e.shiftKey)
      ) {
        e.preventDefault();
        undoManager.redo();
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [undoManager]);
  let { session, authToken } = useAuth();

  let { rep, channel } = useMakeSpaceReplicache({
    id: props.id,
    session: session?.session?.studio || "unauthorized",
    authToken,
    undoManager: undoManager,
  });
  let value = useMemo(() => {
    return rep && channel
      ? { rep, channel, id: props.id, undoManager, data: props.data }
      : null;
  }, [rep, props.id, props.data, undoManager, channel]);

  return (
    <ReplicacheContext.Provider value={value}>
      {props.children}
    </ReplicacheContext.Provider>
  );
};

let reps = new Map<
  string,
  {
    rep: ReturnType<typeof makeReplicache>;
    count: number;
    channel: RealtimeChannel;
  }
>();
export const useMakeSpaceReplicache = ({
  id,
  session,
  authToken,
  undoManager,
}: {
  id: string;
  session?: string;
  authToken?: authToken | null;
  undoManager: UndoManager;
}) => {
  let [rep, setRep] = useState<ReturnType<typeof makeReplicache>>();
  let [channel, setChannel] = useState<RealtimeChannel>();
  let key = `${id}-${session}-${
    authToken ? `${authToken.access_token}-${authToken.refresh_token}` : ""
  }`;

  useEffect(() => {
    let rep = reps.get(key);
    if (!rep) {
      let newRep = makeReplicache({
        name: `space-${id}-${session}-${WORKER_URL}`,
        pusher: async (request) => {
          if (request.pushVersion === 0) {
            return {
              response: {
                error: "VersionNotSupported",
                versionType: "push",
              },
              httpRequestInfo: {
                httpStatusCode: 400,
                errorMessage: "",
              },
            } as const;
          }
          if (!authToken)
            return {
              httpRequestInfo: {
                httpStatusCode: 200,
                errorMessage: "no user logged in",
              },
            };
          await spaceAPI(`${WORKER_URL}/space/${id}`, "push", {
            ...request,
            authToken,
          });
          return {
            httpRequestInfo: {
              httpStatusCode: 200,
              errorMessage: "",
            },
          };
        },
        puller: async (data) => {
          if (data.pullVersion === 0)
            return {
              response: { error: "VersionNotSupported" },
              httpRequestInfo: { httpStatusCode: 200, errorMessage: "" },
            } as const;

          let result = await spaceAPI(`${WORKER_URL}/space/${id}`, "pull", {
            ...data,
            cookie: data.cookie as {
              ephemeralFacts?: string[];
              lastUpdated: string | number;
              order: string | number;
            },
          });
          let ops = result.data.map((fact) => {
            if (fact.retracted)
              return {
                op: "del",
                key: fact.id,
              } as const;
            return {
              op: "put",
              key: fact.id,
              value: FactWithIndexes(fact),
            } as const;
          });
          let messageOps = result.messages.map((m) => {
            return {
              op: "put",
              key: m.id,
              value: MessageWithIndexes(m),
            } as const;
          });
          let ephemeralFacts = result.ephemeralFacts.map((fact) => {
            return {
              op: "put",
              key: fact.id,
              value: FactWithIndexes(fact),
            } as const;
          });
          let deletedEphemeralFacts = result.deletedEphemeralFacts.map(
            (fact) => {
              return { op: "del", key: fact } as const;
            }
          );
          return {
            httpRequestInfo: { httpStatusCode: 200, errorMessage: "" },
            response: {
              cookie: result.cookie,
              lastMutationIDChanges: result.lastMutationIDChanges,
              patch: [
                ...ops,
                ...messageOps,
                ...ephemeralFacts,
                ...deletedEphemeralFacts,
              ],
            },
          };
        },
        undoManager: undoManager,
      });
      let sup = supabaseBrowserClient();
      let channel = sup.channel(`space:${id}`);
      let syncPresenceState = () => {
        const newState = channel.presenceState<{ clientID: string }>();
        let clientIDs = Object.values(newState)
          .flat()
          .map((f) => f.clientID);
        usePresenceState.setState({ clientIDs });
      };
      channel
        .on("broadcast", { event: "poke" }, (msg) => {
          newRep.pull();
        })
        .on("presence", { event: "sync" }, () => {
          syncPresenceState();
        })
        .on("presence", { event: "leave" }, () => {
          syncPresenceState();
        })
        .on("presence", { event: "join" }, () => {
          syncPresenceState();
        });
      channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel.track({ clientID: newRep.clientID });
      });

      rep = {
        channel,
        count: 0,
        rep: newRep,
      };
    }
    setRep(rep.rep);
    setChannel(rep.channel);
    rep.count += 1;
    reps.set(key, rep);
    return () => {
      let rep = reps.get(key);
      if (!rep) return;
      rep.count -= 1;
      if (rep.count === 0) {
        usePresenceState.setState([]);
        rep.channel.unsubscribe();
        rep.rep.close();
        reps.delete(key);
      } else reps.set(key, rep);
    };
  }, [key, authToken, id, session, undoManager]);
  return { rep, channel };
};

export let socketStateAtom = atom<"connecting" | "connected" | "disconnected">(
  "disconnected"
);
