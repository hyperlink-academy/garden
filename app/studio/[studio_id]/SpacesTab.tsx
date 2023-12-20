import { NonUndefined } from "@use-gesture/react";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
};

export function SpaceList({ data }: Props) {
  let [search, setSearch] = useState("");

  let spaces = data?.spaces_in_studios.filter(
    ({ space_data: s }) =>
      s && !s.archived && s.display_name?.toLocaleLowerCase().includes(search)
  );

  if (!data) return;
  return (
    <div className="m-auto flex h-full w-full max-w-6xl flex-col items-stretch gap-2">
      <div className="flex w-full flex-row justify-between ">
        <AddSpace id={data.id} />
        <div className="flex flex-row ">
          <input
            className="w-64"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
      </div>
      <div className="no-scrollbar relative flex h-full w-full flex-row gap-2 overflow-y-scroll ">
        <List spaces={spaces?.map((s) => s.space_data as SpaceData) || []} />
      </div>
    </div>
  );
}

const List = (props: { spaces: Array<SpaceData> }) => {
  let params = useParams<{ studio_id: string }>();

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {props.spaces.map((space) => {
          return (
            <div className="" key={space.id}>
              <Link
                href={`/studio/${params?.studio_id}/space/${space.id}`}
                className="flex flex-col gap-2 text-left"
              >
                <BaseSpaceCard {...space} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
