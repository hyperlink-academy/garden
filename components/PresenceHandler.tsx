import { useMutations } from "hooks/useReplicache";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { ulid } from "src/ulid";
import { socketStateAtom } from "./ReplicacheProvider";

export const PresenceHandler = () => {
  let { rep, mutate, authorized, memberEntity } = useMutations();
  let socketState = useAtomValue(socketStateAtom);
  useEffect(() => {
    if (!authorized || !rep || !memberEntity || socketState !== "connected")
      return;
    rep.clientID.then((clientID) => {
      mutate("initializeClient", {
        clientID,
        clientEntity: ulid(),
        memberEntity: memberEntity as string,
      });
    });
  }, [rep, authorized, memberEntity, socketState]);
  return <></>;
};
