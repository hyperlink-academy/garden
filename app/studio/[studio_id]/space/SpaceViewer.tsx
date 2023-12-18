"use client";

import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData } from "components/SpacesList";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export function SpaceViewer(props: {
  studioName: string;
  children: React.ReactNode;
  spaces: SpaceData[];
}) {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex flex-row gap-2">
        <Link href={`/studio/${params?.studio_id}`}>
          <h3>{props.studioName}</h3>
        </Link>
      </div>
      <SpaceProvider id={activeSpace.do_id}>{props.children}</SpaceProvider>
    </div>
  );
}
