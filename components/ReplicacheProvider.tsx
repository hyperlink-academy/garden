import { ReplicacheContext } from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { Reflect } from "@rocicorp/reflect/client";
import { useAuth } from "hooks/useAuth";
import { UndoManager } from "@rocicorp/undo";
import { mutators, ReplicacheMutators } from "reflect";

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
    let newRep = makeReflect({
      id: props.id,
      authToken,
      studio: session.session?.studio,
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
      {props.children}
    </ReplicacheContext.Provider>
  );
};

export const makeReflect = ({
  id,
  authToken,
  studio,
}: {
  id: string;
  authToken: { access_token: string; refresh_token: string } | null;
  studio?: string;
}) => {
  return new Reflect({
    mutators: mutators,
    auth: JSON.stringify({ authToken }),
    userID: studio || "unauthorized",
    server: process.env.NEXT_PUBLIC_REFLECT_SERVER,
    roomID: id,
  });
};
