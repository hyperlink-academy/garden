import { ReplicacheContext } from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { Reflect } from "@rocicorp/reflect/client";
import { useAuth } from "hooks/useAuth";
import { UndoManager } from "@rocicorp/undo";
import { atom } from "jotai";
import { mutators, ReplicacheMutators } from "reflect";
import { useSubscribe } from "hooks/useSubscribe";
import { spaceAPI } from "backend/lib/api";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const SpaceProvider: React.FC<
  React.PropsWithChildren<{ id: string }>
> = (props) => {
  let [rep, setRep] = useState<Reflect<ReplicacheMutators>>();
  let [undoManager] = useState(new UndoManager());

  useEffect(() => {
    let handler = (e: KeyboardEvent) => {
      if (
        (e.key === "z" && e.ctrlKey) ||
        (e.key === "z" && e.metaKey && !e.shiftKey)
      ) {
        undoManager.undo();
      }
      if (
        (e.key === "y" && e.ctrlKey) ||
        (e.key === "Z" && e.ctrlKey) ||
        (e.key === "z" && e.metaKey && e.shiftKey)
      ) {
        undoManager.redo();
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [undoManager]);

  let { session, authToken } = useAuth();
  useEffect(() => {
    let newRep = new Reflect({
      mutators: mutators,
      auth: JSON.stringify({ authToken }),
      userID: session.session?.studio || "unauthorized",
      socketOrigin: "ws://127.0.0.1:8080",
      roomID: props.id,
    });
    setRep(newRep);
    return () => {
      newRep.close();
    };
  }, [props.id, authToken, session.session?.studio, undoManager]);

  return (
    <ReplicacheContext.Provider
      value={rep ? { rep, id: props.id, undoManager } : null}
    >
      <Initializer id={props.id} r={rep} />
      {props.children}
    </ReplicacheContext.Provider>
  );
};

const Initializer = (props: {
  r?: Reflect<ReplicacheMutators>;
  id: string;
}) => {
  useInitializeReflectSpace(props.id, props.r);
  return <></>;
};

const useInitializeReflectSpace = (
  id: string,
  r?: Reflect<ReplicacheMutators>
) => {
  let initialized = useSubscribe(
    async (tx) => {
      let data = await tx.get("initialized");
      console.log("fetching initialized");
      console.log(data);
      return !!data;
    },
    null,
    [id],
    ""
  );
  useEffect(() => {
    console.log(initialized);
    if (initialized || initialized === null || !r) return;
    spaceAPI(`${WORKER_URL}/space/${id}`, "pull", {
      clientID: "idk",
      cookie: undefined,
      lastMutationID: 0,
      pullVersion: 0,
      schemaVersion: "",
    }).then((result) => {
      r.mutate.initializeSpace({
        id,
        facts: result.data,
        messages: result.messages,
      });
    });
  }, [initialized, id, r]);
};
