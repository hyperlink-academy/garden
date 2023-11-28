import { useMeetingState } from "@daily-co/daily-react";
import { ref } from "data/Facts";
import { useMutations } from "hooks/useReplicache";
import { useRoom } from "hooks/useUIState";
import { useEffect } from "react";
import { ulid } from "src/ulid";

export const PresenceHandler = () => {
  let { rep, mutate, authorized, memberEntity, client } = useMutations();
  let room = useRoom();
  let meetingState = useMeetingState();
  let inCall = meetingState === "joined-meeting";
  useEffect(() => {
    if (!client?.entity || !authorized) return;
    mutate("setClientInCall", {
      clientID: client.clientID,
      clientEntity: client.entity,
      inCall,
    });
  }, [client?.entity, authorized, inCall, client?.clientID, mutate]);

  useEffect(() => {
    if (!authorized || !rep || !memberEntity) return;
    let clientID = rep.clientID;
    mutate("initializeClient", {
      clientID,
      clientEntity: ulid(),
      memberEntity: memberEntity as string,
    });
  }, [rep, authorized, memberEntity, mutate]);
  useEffect(() => {
    if (!client?.entity || !room || !authorized) return;
    mutate("assertEmphemeralFact", {
      clientID: client.clientID,
      entity: client.entity,
      attribute: "presence/in-room",
      value: ref(room),
      positions: {},
    });
  }, [client?.entity, room, authorized, client?.clientID, mutate]);
  return <></>;
};
