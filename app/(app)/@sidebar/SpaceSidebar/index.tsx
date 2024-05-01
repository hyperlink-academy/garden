"use client";
import { Divider } from "components/Layout";
import { Sidebar } from "components/SpaceLayout";
import {
  BellTiny,
  RoomCalendar,
  RoomCanvas,
  RoomChat,
  RoomCollection,
  RoomCard,
  RoomMember,
  RoomSearch,
  UnreadDot,
} from "components/Icons";
import { db, useMutations } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { SidebarTab } from "../SidebarTab";
import { useRoom, useSetRoom } from "hooks/useUIState";
import { People } from "components/SpaceLayout/Sidebar/People";
import { useSpaceData } from "hooks/useSpaceData";
import { useSidebarState } from "../SidebarState";
import { useRoomUnreads } from "components/SpaceLayout/Sidebar/RoomListLayout";
import { useState } from "react";
import { SearchResults } from "../SidebarSearch";
import { CardSearchResult, SpaceSearch, useSearch } from "./SpaceSidebarSearch";

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
}) {
  let { input, setInput, results, exactMatch } = useSearch();
  let [selectedItemIndex, setSelectedItemIndex] = useState(0);
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
          <Sidebar />
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

export const SpaceMobileHeader = (props: { space_id: string }) => {
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));
  let setRoom = useSetRoom();
  let room = useRoom();
  let { memberEntity } = useMutations();
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
    .useEphemeralAttribute("presence/client-member")
    .map((m) => m.value.value);
  let uniqueSessions = new Set(activeSessions);

  let membersOnline = members.filter(
    (f) => uniqueSessions.has(f.entity) && f.entity !== memberEntity
  );

  let membersInCall = db.useEphemeralAttribute("presence/in-call");

  return (
    <div className={`flex h-full flex-row gap-1 text-grey-35`}>
      <SidebarTab
        icon={<RoomSearch />}
        title="Search"
        collapsed
        active={false}
        onClick={() => {
          setSidebar(true);
          setTimeout(() => {
            document
              .getElementById("sidebar-search")
              ?.focus({ preventScroll: true });
          }, 500);
        }}
      />
      <CollapsedUnreadRoom />
      <SidebarTab
        active={room === "calendar"}
        onClick={() => setRoom("calendar")}
        title=""
        collapsed
        icon={<RoomCalendar />}
      />
      <div className="px-1">
        <Divider dashed vertical />
      </div>
      <div className={`flex grow flex-row gap-1 `}>
        {rooms.map((r) => (
          <RoomButton key={r.entity} entityID={r.entity} />
        ))}
      </div>
      {membersOnline.length > 0 && (
        <div
          className={`sticky right-0 z-10 flex flex-row items-center gap-1 border-l pl-1 pr-2  text-sm font-bold ${
            membersInCall.length === 0
              ? "border-grey-80 bg-background text-grey-55"
              : "border-accent-blue bg-background text-accent-blue"
          }`}
        >
          <RoomMember /> {membersOnline.length}
        </div>
      )}
    </div>
  );
};

export const CollapsedSpaceSidebar = (props: {
  space_id: string;
  horizontal?: boolean;
}) => {
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));
  let setRoom = useSetRoom();
  let room = useRoom();
  let { setSidebar } = useSidebarState();
  let { memberEntity } = useMutations();

  let spaceData = useSpaceData(props);

  let members = db
    .useAttribute("member/name")
    .filter((m) =>
      spaceData?.data?.members_in_spaces.find(
        (f) => f.identity_data?.username === m.value
      )
    );
  let activeSessions = db
    .useEphemeralAttribute("presence/client-member")
    .map((m) => m.value.value);
  let uniqueSessions = new Set(activeSessions);

  let membersOnline = members.filter(
    (f) => uniqueSessions.has(f.entity) && f.entity !== memberEntity
  );

  let membersInCall = db.useEphemeralAttribute("presence/in-call");

  return (
    <div
      className={`flex h-full text-grey-35 ${
        props.horizontal ? "flex-row" : "flex-col"
      } gap-1`}
    >
      <div className="w-full pb-1 pt-3 ">
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
            document
              .getElementById("sidebar-search")
              ?.focus({ preventScroll: true });
          }, 500);
        }}
      />
      <CollapsedUnreadRoom />
      <SidebarTab
        active={room === "calendar"}
        onClick={() => setRoom("calendar")}
        title=""
        collapsed
        icon={<RoomCalendar />}
      />

      <div className="w-full py-1">
        <Divider dashed />
      </div>
      <div
        className={`
        ${props.horizontal ? "flex-row" : "flex-col pb-3"}
        z-50 flex grow gap-1 `}
      >
        {rooms.map((r) => (
          <RoomButton key={r.entity} entityID={r.entity} />
        ))}
      </div>
      {membersOnline.length > 0 && (
        <div
          className={`collapsedSidebarPeople
            sticky bottom-0 mx-auto flex w-full
            ${props.horizontal ? "flex-row" : "flex-col"}
            place-items-center gap-2 rounded-md pb-2
            text-center font-bold `}
        >
          <Divider />
          <div
            className={` rounded-md p-1 pt-2 text-white ${
              membersInCall.length === 0 ? "bg-grey-55" : "bg-accent-blue"
            }`}
          >
            <RoomMember /> {membersOnline.length}
          </div>
        </div>
      )}
    </div>
  );
};

const CollapsedUnreadRoom = () => {
  let { memberEntity } = useMutations();
  let unreadCards = db.useReference(memberEntity, "card/unread-by");
  let unreadDiscussions = db.useReference(memberEntity, "discussion/unread-by");
  let setRoom = useSetRoom();
  let room = useRoom();
  let chatRooms = db
    .useAttribute("room/type")
    .filter((room) => room.value === "chat");
  if (!memberEntity) return;
  return (
    <SidebarTab
      active={room === "unreads"}
      onClick={() => setRoom("unreads")}
      title=""
      collapsed
      icon={
        <div className="relative">
          {unreadCards?.length > 0 ||
          unreadDiscussions?.filter(
            (unread) => !chatRooms.find((room) => room.entity === unread.entity)
          ).length > 0 ? (
            <div className="absolute -left-1 -top-0">
              <UnreadDot />
            </div>
          ) : null}
          <BellTiny />
        </div>
      }
    />
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
          ) : roomType?.value === "collection" ? (
            <RoomCollection />
          ) : roomType?.value === "card" ? (
            <RoomCard />
          ) : null
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
