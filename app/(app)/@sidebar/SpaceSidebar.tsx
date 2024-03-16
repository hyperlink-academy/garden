"use client";
import { Divider } from "components/Layout";
import { SpaceRoleBadge } from "components/Space";
import { Sidebar } from "components/SpaceLayout";
import { SearchResults, useSearch } from "components/Search";
import {
  RoomCanvas,
  RoomChat,
  RoomCollection,
  RoomSearch,
} from "components/Icons";
import { db } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { useSidebarState } from "./SidebarLayout";
import { SidebarTab } from "./SidebarTab";
import { useRoom, useSetRoom } from "hooks/useUIState";
import { People } from "components/SpaceLayout/Sidebar/People";

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
  do_id: string;
}) {
  let { input, setInput, results } = useSearch();
  let { open } = useSidebarState();
  if (!open) return <CollapsedSpaceSidebar />;
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

export const CollapsedSpaceSidebar = () => {
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));
  let { setSidebar } = useSidebarState();
  return (
    <div className="flex flex-col gap-2 pt-2">
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
      {rooms.map((r) => (
        <RoomButton key={r.entity} entityID={r.entity} />
      ))}
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
