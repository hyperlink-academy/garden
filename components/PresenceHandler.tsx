import { useMeetingState } from "@daily-co/daily-react";
import { ref } from "data/Facts";
import { useMutations } from "hooks/useReplicache";
import { useRoom } from "hooks/useUIState";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { ulid } from "src/ulid";
import { socketStateAtom } from "./ReplicacheProvider";

export const PresenceHandler = () => {
  let { rep, mutate, authorized, memberEntity, client } = useMutations();
  let room = useRoom();
  let socketState = useAtomValue(socketStateAtom);
  let meetingState = useMeetingState();
  let inCall = meetingState === "joined-meeting";
  useEffect(() => {
    if (!client?.entity || !authorized) return;
    mutate("setClientInCall", {
      clientID: client.clientID,
      clientEntity: client.entity,
      inCall,
    });
  }, [client?.entity, authorized, inCall]);

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
  useEffect(() => {
    if (!client?.entity || !room || !authorized) return;
    mutate("assertEmphemeralFact", {
      clientID: client.clientID,
      entity: client.entity,
      attribute: "presence/in-room",
      value: ref(room),
      positions: {},
    });
  }, [client?.entity, room, authorized]);
  return <></>;
};
