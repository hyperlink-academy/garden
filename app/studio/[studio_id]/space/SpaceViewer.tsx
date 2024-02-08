"use client";

import { SpaceProvider } from "components/ReplicacheProvider";
import { Space } from "components/Space";
import { SpaceData } from "components/SpacesList";
import { useParams } from "next/navigation";

export const fetchCache = "force-no-store";

export function SpaceViewer(props: {
  studioName: string;
  studioID: string;
  spaces: SpaceData[];
}) {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  return (
    <SpaceProvider
      id={activeSpace.do_id}
      data={{ space_id: activeSpace.id, studio_id: undefined }}
    >
      <Space
        space_id={activeSpace.id}
        studio={{
          spaces: props.spaces,
          studioName: props.studioName,
          studioID: props.studioID,
        }}
      />
    </SpaceProvider>
  );
}
