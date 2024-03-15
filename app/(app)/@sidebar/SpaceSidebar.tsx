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

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
  do_id: string;
}) {
  let { input, setInput, results } = useSearch();
  let { open } = useSidebarState();
  if (!open) return <CollapsedSpaceSidebar />;
  return (
    <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch">
      <div className="px-3 pt-3">
        <SpaceRoleBadge space_id={props.space_id} />
      </div>

      <div className="py-3">
        <Divider />
      </div>
      <div className="px-3 pb-2">
        <input
          id="sidebar-search"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder="search space (ctrl/⌘ K)"
          className="false w-full px-2 py-1 text-sm outline-none"
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
