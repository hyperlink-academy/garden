"use client";
import { Reflect } from "@rocicorp/reflect/client";
import { ReplicacheContext } from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { useAuth } from "hooks/useAuth";
import { UndoManager } from "@rocicorp/undo";
import { AuthString, mutators, ReplicacheMutators } from "reflect";

export const SpaceProvider: React.FC<
  React.PropsWithChildren<{
    id: string;
    data:
      | { space_id: string; studio_id: undefined }
      | { studio_id: string; space_id: undefined };
  }>
> = (props) => {
  let [rep, setRep] = useState<Reflect<ReplicacheMutators>>();
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
  useEffect(() => {
    let newRep = makeReflect({
      roomID: props.id,
      authToken,
      userID: session.user?.id,
    });
    setRep(newRep);
    return () => {
      newRep.close();
    };
  }, [props.id, authToken, session.user?.id, undoManager]);

  return (
    <ReplicacheContext.Provider
      value={rep ? { rep, id: props.id, undoManager, data: props.data } : null}
    >
      {props.children}
    </ReplicacheContext.Provider>
  );
};

export const makeReflect = ({
  roomID: id,
  authToken,
  userID,
}: {
  roomID: string;
  authToken: { access_token: string; refresh_token: string } | null;
  userID?: string;
}) => {
  let auth: AuthString = {
    authToken,
  };
  return new Reflect({
    kvStore: "idb",
    mutators: mutators,
    auth: JSON.stringify(auth),
    userID: userID || "unauthorized",
    server: process.env.NEXT_PUBLIC_REFLECT_SERVER,
    roomID: id,
  });
};
