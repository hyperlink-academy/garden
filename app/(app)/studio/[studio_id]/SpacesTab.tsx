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
import { db, scanIndex, useMutations } from "hooks/useReplicache";
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
  let { authorized } = useMutations();
  let { session } = useAuth();
  let allSpaces = data?.spaces_in_studios;
  let yourSpaces = allSpaces.filter(
    (s) =>
      s.space_data?.members_in_spaces.find(
        (m) => m.member === session.user?.id
      ) && !s.space_data?.archived
  );

  let activeSpaces = allSpaces
    .filter(({ space_data: s }) => s && !s.archived)
    .sort(({ space_data: a }, { space_data: b }) => {
      if (!a.display_name || !b.display_name) {
        if (a.display_name) return -1;
        if (b.display_name) return 1;
        return 0;
      }
      return a.display_name.localeCompare(b.display_name);
    });
  let archivedSpaces = allSpaces.filter(
    ({ space_data: s }) => s && !!s.archived
  );

  if (!data) return;
  return (
    <div className="studioSpaces my-3 flex h-full w-full max-w-4xl flex-col gap-4 sm:my-0">
      {authorized && (
        <div className="studioSpacesOptions flex w-full items-center justify-between gap-3  ">
          <AddSpace id={data.id} />
        </div>
      )}

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
                <Divider />
              </div>
            )}
            <List
              spaces={activeSpaces?.map((s) => s.space_data as SpaceData) || []}
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
