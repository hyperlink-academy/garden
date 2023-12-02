import { spaceAPI } from "backend/lib/api";
import { z } from "zod";
import { pullRoute } from "backend/SpaceDurableObject/routes/pull";
import {
  FactWithIndexes,
  makeReplicache,
  MessageWithIndexes,
  ReplicacheContext,
} from "hooks/useReplicache";
import { useCallback, useEffect, useRef, useState } from "react";
import { PullRequest, PushRequest, Replicache } from "replicache";
import { useAuth } from "hooks/useAuth";
import { UndoManager } from "@rocicorp/undo";
import { authToken } from "backend/lib/auth";
import { atom, useSetAtom } from "jotai";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;
export const SpaceProvider: React.FC<
  React.PropsWithChildren<{ id: string }>
> = (props) => {
  let [rep, setRep] = useState<ReturnType<typeof makeReplicache>>();
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
  let reconnect = useWebSocket(props.id, rep);

  let { session, authToken } = useAuth();
  useEffect(() => {
    let newRep = makeSpaceReplicache({
      id: props.id,
      session: session.session?.studio || "unauthorized",
      authToken,
      undoManager: undoManager,
      onPull: () => {
        reconnect();
      },
    });
    setRep(newRep);
    return () => {
      newRep.close();
    };
  }, [props.id, authToken, session.session?.studio, undoManager, reconnect]);

  return (
    <ReplicacheContext.Provider
      value={rep ? { rep, id: props.id, undoManager } : null}
    >
      {props.children}
    </ReplicacheContext.Provider>
  );
};

export const makeSpaceReplicache = ({
  id,
  session,
  onPull,
  authToken,
  undoManager,
}: {
  id: string;
  session?: string;
  onPull?: () => void;
  authToken?: authToken | null;
  undoManager: UndoManager;
}) =>
  makeReplicache({
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
      onPull?.();
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
      let deletedEphemeralFacts = result.deletedEphemeralFacts.map((fact) => {
        return { op: "del", key: fact } as const;
      });
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

export let socketStateAtom = atom<"connecting" | "connected" | "disconnected">(
  "disconnected"
);
const useWebSocket = (id: string, rep?: Replicache) => {
  const [reconnectSocket, setReconnect] = useState({});
  let setSocketState = useSetAtom(socketStateAtom);
  let socket = useRef<WebSocket>();

  let connectSocket = useCallback(
    (rep?: Replicache) => {
      if (socket.current && socket.current.readyState === 1) return;
      socket.current = new WebSocket(`${SOCKET_URL}/space/${id}/socket`);
      setSocketState("connecting");
      socket.current.addEventListener("message", () => {
        rep?.pull();
      });
      socket.current.addEventListener("close", () => {
        setSocketState("disconnected");
      });
      socket.current.addEventListener("open", () => {
        rep?.clientID.then((clientID) => {
          setSocketState("connected");
          socket.current?.send(
            JSON.stringify({
              type: "init",
              data: { clientID },
            })
          );
        });
      });
    },
    [id, setSocketState]
  );

  useEffect(() => {
    let listener = () => {
      if (socket.current) socket.current.close();
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, []);
  useEffect(() => {
    let listener = () => {
      if (socket.current?.readyState !== 1 && rep) connectSocket(rep);
    };
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  }, [rep, connectSocket]);

  useEffect(() => {
    if (!id || !rep) return;
    connectSocket(rep);
    return () => {
      socket.current?.close();
    };
  }, [id, rep, reconnectSocket, connectSocket]);

  useEffect(() => {
    if (rep) {
      rep.clientID.then((clientID) => {
        if (socket.current) {
          if (socket.current.readyState === WebSocket.OPEN)
            socket.current.send(
              JSON.stringify({
                type: "init",
                data: { clientID },
              })
            );
          else
            socket.current.addEventListener("open", () => {
              socket.current?.send(
                JSON.stringify({
                  type: "init",
                  data: { clientID },
                })
              );
            });
        }
      });
    }
  }, [rep]);
  return useCallback(() => {
    if (socket.current?.readyState !== 1) setReconnect({});
  }, []);
};
