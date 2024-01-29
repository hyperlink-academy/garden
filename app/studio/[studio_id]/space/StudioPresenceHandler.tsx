"use client";
import { useMutations } from "hooks/useReplicache";
import { useRoom } from "hooks/useUIState";
import { useEffect } from "react";
import { ulid } from "src/ulid";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData } from "components/SpacesList";
import { useParams } from "next/navigation";

export const StudioPresenceHandler = (props: {
  spaces: SpaceData[];
  studio_do_id: string;
}) => {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  return (
    <SpaceProvider id={props.studio_do_id}>
      <PresenceHandler space_do_id={activeSpace.do_id} />
    </SpaceProvider>
  );
};

export const SpacePageStudioPresenceHandler = (props: { space: SpaceData }) => {
  return (
    <>
      {props.space.spaces_in_studios.map((studio) =>
        studio.studios ? (
          <SpaceProvider id={studio.studios.do_id} key={studio.studio}>
            <PresenceHandler space_do_id={props.space.do_id} />
          </SpaceProvider>
        ) : null
      )}
    </>
  );
};
export const PresenceHandler = (props: { space_do_id: string }) => {
  let { rep, mutate, authorized, memberEntity, client } = useMutations();
  let room = useRoom();

  useEffect(() => {
    if (!authorized || !rep || !memberEntity) return;

    mutate("initializeClient", {
      clientID: rep.clientID,
      clientEntity: ulid(),
      memberEntity: memberEntity as string,
    });
  }, [rep, authorized, memberEntity, mutate]);

  useEffect(() => {
    if (!client?.entity || !authorized) return;
    mutate("assertEmphemeralFact", {
      clientID: client.clientID,
      entity: client.entity,
      attribute: "presence/in-space",
      value: props.space_do_id,
      positions: {},
    });
  }, [
    client?.entity,
    room,
    authorized,
    client?.clientID,
    mutate,
    props.space_do_id,
  ]);
  return <></>;
};
