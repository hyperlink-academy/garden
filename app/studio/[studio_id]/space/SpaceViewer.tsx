"use client";

import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData } from "components/SpacesList";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export const fetchCache = "force-no-store";

export function SpaceViewer(props: {
  studioName: string;
  children: React.ReactNode;
  spaces: SpaceData[];
}) {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  return <SpaceProvider id={activeSpace.do_id}>{props.children}</SpaceProvider>;
}
