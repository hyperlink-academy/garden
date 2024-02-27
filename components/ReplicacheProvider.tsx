"use client";
import { spaceAPI } from "backend/lib/api";
import { z } from "zod";
import { pullRoute } from "backend/SpaceDurableObject/routes/pull";
import {
  FactWithIndexes,
  makeReplicache,
  MessageWithIndexes,
  ReplicacheContext,
} from "hooks/useReplicache";
import { useEffect, useRef, useState } from "react";
import { PullRequest, PushRequest } from "replicache";
import { useAuth } from "hooks/useAuth";
import { UndoManager } from "@rocicorp/undo";
import { authToken } from "backend/lib/auth";
import { atom } from "jotai";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

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

  let rep = useMakeSpaceReplicache({
    id: props.id,
    session: session?.session?.studio || "unauthorized",
    authToken,
    undoManager: undoManager,
  });

  return (
    <ReplicacheContext.Provider
      value={rep ? { rep, id: props.id, undoManager, data: props.data } : null}
    >
      {props.children}
    </ReplicacheContext.Provider>
  );
};

let reps = new Map<
  string,
  { rep: ReturnType<typeof makeReplicache>; count: number; socket: WebSocket }
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
  let key = `${id}-${session}-${
    authToken ? `${authToken.access_token}-${authToken.refresh_token}` : ""
  }`;

  useEffect(() => {
    let rep = reps.get(key);
    if (!rep) {
      let socket = new WebSocket(`${SOCKET_URL}/space/${id}/socket`);
      let newRep = makeReplicache({
        name: `space-${id}-${session}-${WORKER_URL}`,
        pusher: async (request) => {
          let data: PushRequest = await request.json();
          if (!authToken)
            return { httpStatusCode: 200, errorMessage: "no user logged in" };
          await spaceAPI(`${WORKER_URL}/space/${id}`, "push", {
            ...data,
            authToken,
          });
          return { httpStatusCode: 200, errorMessage: "" };
        },
        puller: async (request) => {
          let data: PullRequest = await request.json();
          let result = await spaceAPI(
            `${WORKER_URL}/space/${id}`,
            "pull",
            data as z.infer<typeof pullRoute.input>
          );
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
              lastMutationID: result.lastMutationID,
              cookie: result.cookie,
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

      socket.addEventListener("message", () => {
        newRep.pull();
      });
      socket.addEventListener("open", () => {
        newRep.clientID.then((clientID) => {
          if (socket.readyState !== WebSocket.OPEN) return;
          socket.send(
            JSON.stringify({
              type: "init",
              data: { clientID },
            })
          );
        });
      });
      rep = {
        socket,
        count: 1,
        rep: newRep,
      };
      reps.set(key, rep);
    }
    setRep(rep.rep);
    rep.count += 1;
    reps.set(key, rep);
    return () => {
      let rep = reps.get(key);
      if (!rep) return;
      rep.count -= 1;
      if (rep.count === 0) {
        rep.socket.close();
        rep.rep.close();
        reps.delete(key);
      } else reps.set(key, rep);
    };
  }, [key, authToken, id, session, undoManager]);
  return rep;
};

export let socketStateAtom = atom<"connecting" | "connected" | "disconnected">(
  "disconnected"
);
