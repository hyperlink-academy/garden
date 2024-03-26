"use client";
import { Divider } from "components/Layout";
import { Sidebar } from "components/SpaceLayout";
import {
  RoomCanvas,
  RoomChat,
  RoomCollection,
  RoomMember,
  RoomSearch,
  UnreadDot,
} from "components/Icons";
import { db } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { SidebarTab } from "../SidebarTab";
import { useRoom, useSetRoom } from "hooks/useUIState";
import { People } from "components/SpaceLayout/Sidebar/People";
import { useSpaceData } from "hooks/useSpaceData";
import { useSetSidebarTitle, useSidebarState } from "../SidebarState";
import { useRoomUnreads } from "components/SpaceLayout/Sidebar/RoomListLayout";
import { useIsMobile } from "hooks/utils";
import { useState } from "react";
import { SearchResults } from "../SidebarSearch";
import { CardSearchResult, SpaceSearch, useSearch } from "./SpaceSidebarSearch";

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
  do_id: string;
}) {
  useSetSidebarTitle(() => props.display_name, [props.display_name]);

  let { input, setInput, results, exactMatch } = useSearch();
  let [selectedItemIndex, setSelectedItemIndex] = useState(0);
  let { open } = useSidebarState();
  let isMobile = useIsMobile();
  if (!open && !isMobile)
    return <CollapsedSpaceSidebar space_id={props.space_id} />;
  return (
    <div className="flex h-full flex-col">
      <div className="sidebarSpaceContent flex h-full min-h-0 shrink grow flex-col ">
        <div className="sidebarSearchWrapper px-3 pb-2">
          <SpaceSearch
            setInput={setInput}
            exactMatch={exactMatch}
            results={results}
            selectedItemIndex={selectedItemIndex}
            setSelectedItemIndex={setSelectedItemIndex}
            input={input}
          />
        </div>

        {input === "" ? (
          <Sidebar space_id={props.space_id} />
        ) : (
          <SearchResults
            getKey={(r) => r.entity}
            renderResult={(r) => <CardSearchResult entityID={r.entity} />}
            results={results}
            selectedItemIndex={selectedItemIndex}
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
    <div className="flex h-full flex-col gap-1 text-accent-blue">
      <div className="w-full pb-1 pt-3">
        <Divider />
      </div>

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
      <div className="z-50 flex grow flex-col gap-1 pb-3 text-grey-55">
        {rooms.map((r) => (
          <RoomButton key={r.entity} entityID={r.entity} />
        ))}
      </div>
      {membersOnline.length > 0 && (
        <div
          className={`collapsedSidebarPeople
            sticky bottom-0 mx-auto flex w-full flex-col
            place-items-center gap-1 rounded-md bg-white pb-3
            text-center font-bold `}
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
  let unreads = useRoomUnreads(props.entityID);
  return (
    <div className="relative">
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
      {unreads && (
        <div className="absolute left-0 top-1">
          <UnreadDot />
        </div>
      )}
    </div>
  );
};
