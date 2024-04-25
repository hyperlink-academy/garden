import { useMeetingState } from "@daily-co/daily-react";
import { ref } from "data/Facts";
import { scanIndex, useMutations } from "hooks/useReplicache";
import { useSubscribe } from "hooks/useSubscribe";
import { useRoom } from "hooks/useUIState";
import { useEffect } from "react";
import { ulid } from "src/ulid";

export const PresenceHandler = () => {
  let { rep, mutate, authorized, memberEntity } = useMutations();
  let room = useRoom();
  let meetingState = useMeetingState();
  let inCall = meetingState === "joined-meeting";
  let client = useSubscribe(
    async (tx) => {
      return (
        (await scanIndex(tx).ave("presence/client-id", tx.clientID)) || null
      );
    },
    null,
    []
  );
  useEffect(() => {
    if (!client?.entity || !authorized) return;
    mutate("setClientInCall", {
      clientID: client.value,
      clientEntity: client.entity,
      inCall,
    });
  }, [client?.value, client?.entity, authorized, inCall, mutate]);

  useEffect(() => {
    if (!client) return;
    let handler = () => {
      mutate("retractEphemeralFact", {
        clientID: client.value,
        id: client.id,
      });
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [client, mutate]);

  useEffect(() => {
    if (!authorized || !rep || !memberEntity) return;
    let clientID = rep.clientID;
    if (!client) {
      mutate("initializeClient", {
        clientID,
        clientEntity: ulid(),
        memberEntity: memberEntity as string,
      });
    } else {
      let clientEntity = client.entity;
      let interval = setInterval(() => {
        mutate("initializeClient", {
          clientID,
          clientEntity,
          memberEntity: memberEntity as string,
        });
      }, 1000 * 60);
      return () => {
        window.clearInterval(interval);
      };
    }
  }, [rep, authorized, memberEntity, mutate, client]);

  useEffect(() => {
    if (!client?.entity || !room || !authorized) return;
    mutate("assertEmphemeralFact", {
      clientID: client.value,
      entity: client.entity,
      attribute: "presence/in-room",
      value: ref(room),
      positions: {},
    });
  }, [client?.value, client?.entity, room, authorized, mutate]);
  return <></>;
};
