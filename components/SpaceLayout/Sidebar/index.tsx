"use client";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import {
  BellSmall,
  RoomCalendar,
  RoomSettings,
  Settings,
  UnreadDot,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { useRouter } from "next/navigation";
import { EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import { useSpaceData } from "hooks/useSpaceData";
import { DotLoader } from "components/DotLoader";
import { useIsActiveRoom, useRoom, useSetRoom } from "hooks/useUIState";
import { ModalSubmitButton, Modal } from "components/Modal";
import { useUIState } from "hooks/useUIState";
import { Truncate } from "components/Truncate";
import { SpaceData } from "components/SpacesList";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { Divider } from "components/Layout";
import { useIsMobile } from "hooks/utils";
import { useSidebarState } from "app/(app)/@sidebar/SidebarState";

export const Sidebar = () => {
  let [roomEditOpen, setRoomEditOpen] = useState(false);

  return (
    <div className="roomList mb-3 flex h-fit min-h-0 w-full grow flex-col gap-2 px-3 text-grey-35">
      <div className="flex flex-col">
        <UnreadsRoomButton />
        <RoomButton roomID="calendar">
          <RoomCalendar /> Calendar
        </RoomButton>
      </div>

      <Divider dashed />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SharedRoomList setRoomEditOpen={() => setRoomEditOpen(true)} />
        </div>
      </div>
      <EditRoomModalWithRoom
        open={roomEditOpen}
        onClose={() => setRoomEditOpen(false)}
      />
    </div>
  );
};

const EditRoomModalWithRoom = (props: {
  open: boolean;
  onClose: () => void;
}) => {
  let room = useRoom();

  return <EditRoomModal {...props} room={room} />;
};

const UnreadsRoomButton = () => {
  let { memberEntity, permissions } = useMutations();
  let authorized = permissions.commentAndReact;
  let unreadCards = db.useReference(memberEntity, "card/unread-by");
  let unreadDiscussions = db.useReference(memberEntity, "discussion/unread-by");
  let chatRooms = db
    .useAttribute("room/type")
    .filter((room) => room.value === "chat");
  if (!authorized) return null;

  return (
    <RoomButton roomID="unreads">
      {unreadCards?.length > 0 ||
      unreadDiscussions?.filter(
        (unread) => !chatRooms.find((room) => room.entity === unread.entity)
      ).length > 0 ? (
        <div className="absolute left-0 top-1">
          <UnreadDot />
        </div>
      ) : null}
      <BellSmall /> Unreads
    </RoomButton>
  );
};

const RoomButton = (props: { roomID: string; children: React.ReactNode }) => {
  let isActiveRoom = useIsActiveRoom(props.roomID);
  let isMobile = useIsMobile();
  let { setSidebar } = useSidebarState();
  let setRoom = useSetRoom();
  return (
    <button
      className={`relative flex w-full items-center gap-1 rounded-md border border-white px-1 py-0.5 ${
        isActiveRoom
          ? "rounded-md border border-accent-blue bg-accent-blue font-bold text-white"
          : "text-grey-35 hover:border hover:border-grey-80"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        let roomView = document.getElementById("roomWrapper");
        setRoom(props.roomID);
        roomView ? roomView.scrollIntoView({ behavior: "smooth" }) : null;
        if (isMobile) {
          setSidebar(false);
        }
      }}
    >
      {props.children}
    </button>
  );
};

export const SpaceName = (props: { truncate?: boolean; space_id: string }) => {
  let { data } = useSpaceData({ space_id: props.space_id });

  return (
    <div className={`spaceName flex min-w-0 bg-inherit text-grey-35`}>
      {props.truncate ? (
        <Truncate className="w-full max-w-none overflow-hidden bg-inherit">
          <h3 className="SpaceName whitespace-nowrap">{data?.display_name}</h3>
        </Truncate>
      ) : (
        <h4 className="SpaceName whitespace-normal">{data?.display_name}</h4>
      )}
    </div>
  );
};
