import { NonUndefined } from "@use-gesture/react";
import {
  DisclosureCollapseTiny,
  DisclosureExpandTiny,
  RoomMember,
  RoomSearch,
} from "components/Icons";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { useAuth } from "hooks/useAuth";
import { db } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
};

export function SpaceList({ data }: Props) {
  let [search, setSearch] = useState("");

  let allSpaces = data?.spaces_in_studios;

  let activeSpaces = allSpaces.filter(
    ({ space_data: s }) =>
      s &&
      !s.archived &&
      s.display_name?.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );

  let archivedSpaces = allSpaces.filter(
    ({ space_data: s }) =>
      s &&
      !!s.archived &&
      s.display_name?.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );

  let { session } = useAuth();
  let authorized = data.members_in_studios.find(
    (m) => m.member === session.user?.id
  );

  if (!data) return;
  return (
    <div className="no-scrollbar studioSpacesWrapper mx-auto h-full overflow-y-scroll pb-6 sm:pt-2">
      <div className="studioSpaces flex h-full w-full flex-col gap-4">
        {authorized && (
          <div className="studioSpacesOptions flex w-full items-center justify-between gap-3  ">
            <AddSpace id={data.id} />
          </div>
        )}

        <div className=" studioSpaceListWrapper no-scrollbar relative flex h-full w-full flex-col gap-8 overflow-y-scroll ">
          {allSpaces.length > 0 ? (
            <>
              <List
                spaces={
                  activeSpaces?.map((s) => s.space_data as SpaceData) || []
                }
              />
              {archivedSpaces.length > 0 && (
                <HistoryList
                  spaces={
                    archivedSpaces?.map((s) => s.space_data as SpaceData) || []
                  }
                />
              )}
            </>
          ) : (
            <EmptyStudio />
          )}
        </div>
      </div>
    </div>
  );
}

const List = (props: { spaces: Array<SpaceData> }) => {
  let params = useParams<{ studio_id: string }>();
  let peopleInSpaces = db.useAttribute("presence/in-space");

  return (
    <div className="studioSpaceList w-full ">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {props.spaces.map((space) => {
          let presences = peopleInSpaces.filter((p) => p.value === space.do_id);
          return (
            <div className="relative" key={space.id}>
              <div className="absolute right-2 top-1">
                {presences.slice(0, 4).map((p) => (
                  <SpacePresence entityID={p.entity} key={p.entity} />
                ))}
                {presences.length < 5 ? null : (
                  <div className=" bg-accent-blue mt-1 flex items-center gap-0.5 rounded-t-md px-[6px]  pb-2 pt-0.5 text-xs font-bold text-white">
                    + {presences.length - 4}
                    <span>
                      <RoomMember />
                    </span>
                  </div>
                )}
              </div>
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

const SpacePresence = (props: { entityID: string }) => {
  let member = db.useEntity(props.entityID, "presence/client-member");
  let name = db.useEntity(member?.value.value || null, "member/name");
  let color = db.useEntity(member?.value.value || null, "member/color");
  return (
    <span
      className="relative ml-1 rounded-t-md px-1 pb-2 pt-0.5  text-xs font-bold text-white"
      style={{ backgroundColor: color?.value }}
    >
      {name?.value}
    </span>
  );
};

const HistoryList = (props: { spaces: Array<SpaceData> }) => {
  let spacesHistory = props.spaces.filter((s) => s.archived);
  let [showHistory, setShowHistory] = useState(false);
  let params = useParams<{ studio_id: string }>();

  let query = useParams<{ studio: string }>();
  return (
    <>
      {spacesHistory.length > 0 ? (
        <div className="myStudioCompleted">
          <button
            className={`hover:text-accent-blue flex items-center gap-2 ${
              showHistory ? "text-grey-15" : "text-grey-55"
            }`}
            onClick={() => {
              setShowHistory(!showHistory);
            }}
          >
            <h4>Archived ({spacesHistory.length})</h4>
            {!showHistory ? (
              <DisclosureCollapseTiny />
            ) : (
              <DisclosureExpandTiny />
            )}
          </button>
          <div className={`${showHistory ? "" : "hidden"}`}>
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
          </div>
        </div>
      ) : null}
    </>
  );
};

const EmptyStudio = () => {
  return (
    <div className="lightBorder bg-bg-blue flex h-fit flex-col gap-4 p-4">
      <h3>⚠️ under construction ⚠️</h3>
      <p>This Studio does not yet contain any Spaces!</p>
    </div>
  );
};
