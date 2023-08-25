import { useMutations } from "hooks/useReplicache";
import { useEffect } from "react";
import { ulid } from "src/ulid";

export const PresenceHandler = () => {
  let { rep, mutate, authorized, memberEntity } = useMutations();
  useEffect(() => {
    if (!authorized || !rep || !memberEntity) return;
    rep.clientID.then((clientID) => {
      mutate("initializeClient", {
        clientID,
        clientEntity: ulid(),
        memberEntity: memberEntity as string,
      });
    });
  }, [rep, authorized, memberEntity]);
  return <></>;
};
