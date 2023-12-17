"use client";

import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData } from "components/SpacesList";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export function SpaceViewer(props: {
  children: React.ReactNode;
  spaces: SpaceData[];
}) {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let router = useRouter();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  console.log(activeSpace);
  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex flex-row gap-2">
        <Link href={`/studio/${params?.studio_id}`}>
          <div>back to studio</div>
        </Link>
        <button
          onClick={() => {
            if (!params) return;
            router.push(
              `/studio/${params.studio_id}/space/${
                props.spaces[
                  (props.spaces.findIndex((x) => x.id === params?.space_id) +
                    1) %
                    props.spaces.length
                ].id
              }`
            );
          }}
        >
          next
        </button>
      </div>
      <SpaceProvider id={activeSpace.do_id}>{props.children}</SpaceProvider>
    </div>
  );
}
