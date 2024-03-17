"use client";
import { Divider } from "components/Layout";
import { SpaceRoleBadge } from "components/Space";
import { Sidebar } from "components/SpaceLayout";
import { SearchResults, useSearch } from "components/Search";
import {
  RoomCanvas,
  RoomChat,
  RoomCollection,
  RoomMember,
  RoomSearch,
} from "components/Icons";
import { db } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { useSidebarState } from "./SidebarLayout";
import { SidebarTab } from "./SidebarTab";
import { useRoom, useSetRoom } from "hooks/useUIState";
import { People } from "components/SpaceLayout/Sidebar/People";
import { useSpaceData } from "hooks/useSpaceData";

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
  do_id: string;
}) {
  let { input, setInput, results } = useSearch();
  let { open } = useSidebarState();
  if (!open) return <CollapsedSpaceSidebar space_id={props.space_id} />;
  return (
    <div className="flex h-full flex-col">
      <div className="sidebarSpaceContent flex h-full min-h-0 shrink grow flex-col ">
        <div className="sidebarRolebadgeWrapper shrink-0 px-3 pt-3">
          <SpaceRoleBadge space_id={props.space_id} />
        </div>

        <div className="divider shrink-0 py-3">
          <Divider />
        </div>
        <div className="sidebarSearchWrapper px-3 pb-2">
          <input
            id="sidebar-search"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            placeholder="search space (ctrl/⌘ K)"
            className="sidebarSearch w-full px-2 py-1 text-sm outline-none"
          />
        </div>
        {input === "" ? (
          <Sidebar space_id={props.space_id} />
        ) : (
          <SearchResults
            results={results}
            onClick={() => {}}
            suggestionIndex={0}
          />
        )}
      </div>
      <div className="sidebarPeoplePanel sticky bottom-0 h-fit max-h-[40%] shrink-0 overflow-y-scroll bg-white px-3 pb-3 ">
        <div className="divider pb-1 ">
          <Divider />
        </div>
        <People space_id={props.space_id} />
      </div>
    </div>
  );
}

export const CollapsedSpaceSidebar = (props: { space_id: string }) => {
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));
  let { setSidebar } = useSidebarState();

  let spaceData = useSpaceData(props);

  let members = db
    .useAttribute("member/name")
    .filter((m) =>
      spaceData?.data?.members_in_spaces.find(
        (f) => f.identity_data?.username === m.value
      )
    );
  let activeSessions = db
    .useAttribute("presence/client-member")
    .map((m) => m.value.value);
  let uniqueSessions = new Set(activeSessions);

  let membersOnline = members.filter((f) => uniqueSessions.has(f.entity));

  let membersInCall = db.useAttribute("presence/in-call");
  console.log(membersInCall);

  return (
    <div className="text-accent-blue flex h-full flex-col pt-2">
      <SidebarTab
        icon={<RoomSearch />}
        title="Search"
        collapsed
        active={false}
        onClick={() => {
          setSidebar(true);
          setTimeout(() => {
            document.getElementById("sidebar-search")?.focus();
          }, 50);
        }}
      />
      <div className="text-grey-55 flex grow flex-col gap-2 pb-3">
        {rooms.map((r) => (
          <RoomButton key={r.entity} entityID={r.entity} />
        ))}
      </div>
      {membersOnline.length > 0 && (
        <div
          className={`collapsedSidebarPeople sticky bottom-0 mx-auto flex w-full flex-col place-items-center gap-1 rounded-md bg-white pb-3  text-center font-bold `}
        >
          <Divider />
          <div
            className={` rounded-md p-1 pt-2 text-white ${
              membersInCall.length === 0 ? "bg-accent-blue" : "bg-grey-55"
            }`}
          >
            <RoomMember /> {membersOnline.length}
          </div>
        </div>
      )}
    </div>
  );
};

const RoomButton = (props: { entityID: string }) => {
  let roomType = db.useEntity(props.entityID, "room/type");
  let setRoom = useSetRoom();
  let room = useRoom();
  return (
    <SidebarTab
      title=""
      active={room === props.entityID}
      collapsed
      onClick={() => {
        setRoom(props.entityID);
      }}
      icon={
        roomType?.value === "canvas" ? (
          <RoomCanvas />
        ) : roomType?.value === "chat" ? (
          <RoomChat />
        ) : (
          <RoomCollection />
        )
      }
    />
  );
};
