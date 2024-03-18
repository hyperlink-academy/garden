import { NonUndefined } from "@use-gesture/react";
import {
  DisclosureCollapseTiny,
  DisclosureExpandTiny,
  RoomMember,
  RoomSearch,
} from "components/Icons";
import { Divider } from "components/Layout";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { useAuth } from "hooks/useAuth";
import { db, scanIndex } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import { useSubscribe } from "hooks/useSubscribe";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
};

export function SpaceList({ data }: Props) {
  let [search, setSearch] = useState("");
  let { session } = useAuth();
  let authorized = data.members_in_studios.find(
    (m) => m.member === session.user?.id
  );
  let allSpaces = data?.spaces_in_studios;
  let yourSpaces = allSpaces.filter(
    (s) =>
      s.space_data?.members_in_spaces.find(
        (m) => m.member === session.user?.id
      ) && !s.space_data?.archived
  );

  let activeSpaces = allSpaces.filter(
    ({ space_data: s }) =>
      s &&
      !s.members_in_spaces.find((m) => m.member === session.user?.id) &&
      !s.archived &&
      s.display_name?.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );

  let archivedSpaces = allSpaces.filter(
    ({ space_data: s }) =>
      s &&
      !!s.archived &&
      s.display_name?.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );

  if (!data) return;
  return (
    <div className="no-scrollbar studioSpacesWrapper mx-auto h-full overflow-y-scroll pb-6 sm:pt-10">
      <div className="studioSpaces flex h-full w-full flex-col gap-4">
        <div className="studioSpacesOptions flex w-full items-center justify-between gap-3  ">
          {authorized && <AddSpace id={data.id} />}

          {allSpaces.length > 0 && (
            <div className="studioSpacesSearch relative flex flex-row">
              <RoomSearch className="absolute right-2 top-[10px] text-grey-55" />
              <input
                className="h-fit w-full max-w-sm bg-white py-1 pl-2 pr-6 outline-none sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                placeholder="search spaces…"
                onFocus={(e) =>
                  e.currentTarget.setSelectionRange(
                    0,
                    e.currentTarget.value.length
                  )
                }
              />
            </div>
          )}
        </div>
        <div className=" studioSpaceListWrapper no-scrollbar relative flex h-full w-full flex-col gap-8 overflow-y-scroll ">
          {allSpaces.length > 0 ? (
            <>
              {yourSpaces.length > 0 && (
                <div className="-mb-2 flex flex-col gap-8">
                  <div>
                    <h3>Your Spaces</h3>
                    <List
                      spaces={
                        yourSpaces?.map((s) => s.space_data as SpaceData) || []
                      }
                    />
                  </div>
                  {yourSpaces.length !== allSpaces.length && <Divider />}
                </div>
              )}
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
  let peopleInSpaces = useSubscribe(
    async (tx) => {
      let presenceInSpaces = await scanIndex(tx).aev("presence/in-space");
      return Promise.all(
        presenceInSpaces.map(async (p) => {
          let member = await scanIndex(tx).eav(
            p.entity,
            "presence/client-member"
          );
          return { ...p, member };
        })
      );
    },
    [],
    [],
    ""
  );

  return (
    <div className="studioSpaceList w-full ">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {props.spaces.map((space) => {
          let presences = peopleInSpaces
            .filter((p) => p.value === space.do_id)
            .reduce((acc, p) => {
              if (
                !acc.find(
                  (f) =>
                    f.member && f.member.value.value === p.member?.value.value
                )
              )
                acc.push(p);
              return acc;
            }, [] as typeof peopleInSpaces);
          return (
            <div className="relative" key={space.id}>
              <div className="absolute right-2 top-1">
                {presences.slice(0, 4).map((p) => (
                  <SpacePresence entityID={p.entity} key={p.entity} />
                ))}
                {presences.length < 5 ? null : (
                  <div className=" mt-1 flex items-center gap-0.5 rounded-t-md bg-accent-blue px-[6px]  pb-2 pt-0.5 text-xs font-bold text-white">
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
            className={`flex items-center gap-2 hover:text-accent-blue ${
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
    <div className="lightBorder flex h-fit flex-col gap-4 bg-bg-blue p-4">
      <h3>⚠️ under construction ⚠️</h3>
      <p>This Studio does not yet contain any Spaces!</p>
    </div>
  );
};
