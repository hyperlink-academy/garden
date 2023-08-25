import { useMutations } from "hooks/useReplicache";
import { useEffect } from "react";

export const PresenceHandler = () => {
  let { rep, mutate, authorized, memberEntity } = useMutations();
  useEffect(() => {
    if (!authorized || !rep || !memberEntity) return;
    rep.clientID.then((clientID) => {
      mutate("assertEmphemeralFact", {
        clientID,
        entity: memberEntity as string,
        attribute: "presence/client-id",
        value: clientID,
        positions: {},
      });
    });
  }, [rep, authorized, memberEntity]);
  return <></>;
};
