"use client";
import { useMeetingState } from "@daily-co/daily-react";
import { ref } from "data/Facts";
import { useMutations } from "hooks/useReplicache";
import { useRoom } from "hooks/useUIState";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { ulid } from "src/ulid";
import { SpaceProvider, socketStateAtom } from "components/ReplicacheProvider";
import { SpaceData } from "components/SpacesList";
import { useParams } from "next/navigation";

export const StudioPresenceHandler = (props: {
  spaces: SpaceData[];
  studio_do_id: string;
  studio_id: string;
}) => {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  return (
    <SpaceProvider
      id={props.studio_do_id}
      data={{ studio_id: props.studio_id, space_id: undefined }}
    >
      <PresenceHandler space_do_id={activeSpace.do_id} />
    </SpaceProvider>
  );
};

export const SpacePageStudioPresenceHandler = (props: { space: SpaceData }) => {
  return (
    <>
      {props.space.spaces_in_studios.map((studio) =>
        studio.studios ? (
          <SpaceProvider
            id={studio.studios.do_id}
            key={studio.studio}
            data={{ studio_id: studio.studio, space_id: undefined }}
          >
            <PresenceHandler space_do_id={props.space.do_id} />
          </SpaceProvider>
        ) : null
      )}
    </>
  );
};
export const PresenceHandler = (props: { space_do_id: string }) => {
  let { rep, mutate, authorized, memberEntity, client, permissions } =
    useMutations();
  let room = useRoom();
  let socketState = useAtomValue(socketStateAtom);

  useEffect(() => {
    if (!authorized || !rep || !memberEntity || socketState !== "connected")
      return;
    let clientID = rep.clientID;
    mutate("initializeClient", {
      clientID,
      clientEntity: ulid(),
      memberEntity: memberEntity as string,
    });
  }, [rep, authorized, memberEntity, socketState, mutate]);

  useEffect(() => {
    if (!client?.entity || !authorized) return;
    mutate("assertEmphemeralFact", {
      clientID: client.value,
      entity: client.entity,
      attribute: "presence/in-space",
      value: props.space_do_id,
      positions: {},
    });
  }, [
    client?.entity,
    room,
    authorized,
    client?.value,
    mutate,
    props.space_do_id,
  ]);
  return <></>;
};
