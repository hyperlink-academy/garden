import { NonUndefined } from "@use-gesture/react";
import { RoomSearch } from "components/Icons";
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
    <div className="studioSpacesWrapper mx-auto h-full overflow-y-scroll pb-6 sm:pt-6">
      <div className="studioSpaces flex h-full w-full flex-col gap-4">
        <div className="studioSpacesOptions flex w-full  items-center justify-between gap-3  ">
          <AddSpace id={data.id} />

          <div className="studioSpacesSearch relative flex flex-row text-sm">
            <RoomSearch className="absolute right-2 top-2  text-grey-55" />
            <input
              className="h-fit w-full max-w-sm bg-white py-1 pl-2 pr-6 outline-none sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              placeholder="search spaces..."
              onFocus={(e) =>
                e.currentTarget.setSelectionRange(
                  0,
                  e.currentTarget.value.length
                )
              }
            />
          </div>
        </div>
        <div className=" studioSpaceListWrapper no-scrollbar relative flex h-full w-full flex-row gap-2 overflow-y-scroll ">
          <List spaces={spaces?.map((s) => s.space_data as SpaceData) || []} />
        </div>
      </div>
    </div>
  );
}

const List = (props: { spaces: Array<SpaceData> }) => {
  let params = useParams<{ studio_id: string }>();

  return (
    <div className="studioSpaceList w-full ">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
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
