"use client";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import {
  ArrowUp,
  BellSmall,
  RoomCalendar,
  RoomSettings,
  Settings,
  UnreadDot,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { useParams, useRouter } from "next/navigation";
import { EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import { useSpaceData } from "hooks/useSpaceData";
import { People } from "./People";
import { DotLoader } from "components/DotLoader";
import { useIsActiveRoom, useRoom, useSetRoom } from "hooks/useUIState";
import { ModalSubmitButton, Modal } from "components/Modal";
import { useUIState } from "hooks/useUIState";
import { Truncate } from "components/Truncate";
import { SpaceData } from "components/SpacesList";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { Divider } from "components/Layout";

export const Sidebar = (props: {
  mobile?: boolean;
  space_id: string;
  studio?: { spaces: SpaceData[]; studioName: string; studioID: string };
}) => {
  let [roomEditOpen, setRoomEditOpen] = useState(false);

  return (
    <div className="roomList text-grey-35 mb-3 flex h-fit min-h-0 w-full grow flex-col gap-2 px-3">
      <div className="flex flex-col">
        <SpaceSettings space_id={props.space_id} />
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
  let setRoom = useSetRoom();
  return (
    <button
      className={`relative flex w-full items-center gap-1 rounded-md border border-white px-1 py-0.5 ${
        isActiveRoom
          ? "border-accent-blue bg-accent-blue rounded-md border font-bold text-white"
          : "text-grey-35 hover:border-grey-80 hover:border"
      }`}
      onClick={() => {
        let roomView = document.getElementById("roomWrapper");
        setRoom(props.roomID);
        roomView ? roomView.scrollIntoView({ behavior: "smooth" }) : null;
      }}
    >
      {props.children}
    </button>
  );
};

export const SpaceName = (props: { truncate?: boolean; space_id: string }) => {
  let { data } = useSpaceData({ space_id: props.space_id });

  return (
    <div className={`spaceName text-grey-35 flex min-w-0 bg-inherit`}>
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

const SpaceSettings = (props: { space_id: string }) => {
  let spaceID = useSpaceID();
  let { authorized } = useMutations();
  let { data } = useSpaceData(props);
  let router = useRouter();
  let { session } = useAuth();

  let setMobileSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);
  let isOwner =
    session.session && session.session.username === data?.owner.username;
  let [editModal, setEditModal] = useState(false);

  return (
    <>
      {!authorized ? null : isOwner ? (
        <div className="flex w-full flex-row items-center gap-1 py-0.5 pl-1 pr-0.5 text-left ">
          <button
            className={`"text-grey-35 hover:border-grey-80 hover:border" relative flex w-full items-center gap-1 rounded-md border border-white px-1 py-0.5          `}
            onClick={() => {
              setEditModal(true);
              setMobileSidebarOpen(false);
            }}
          >
            <RoomSettings /> Settings
          </button>
        </div>
      ) : (
        <MemberOptions />
      )}

      <EditSpaceModal
        space_id={props.space_id}
        open={editModal}
        onDelete={() => {
          if (!session.session) return;
          router.push(`/s/${session.session.username}`);
        }}
        onClose={() => setEditModal(false)}
        spaceID={spaceID}
      />
    </>
  );
};

const MemberOptions = () => {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  let { authToken, session } = useAuth();
  let spaceID = useSpaceID();
  let router = useRouter();
  let [loading, setLoading] = useState(false);

  return (
    <>
      <Popover.Root>
        <Popover.Trigger className="hover:text-accent-blue shrink-0 rounded-md border border-transparent  pt-[1px]">
          <Settings />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="border-grey-80 z-50 flex max-w-xs flex-col gap-2 rounded-md border bg-white py-2 drop-shadow-md"
            sideOffset={4}
          >
            <button
              className="text-accent-red hover:bg-bg-blue px-2 font-bold"
              onClick={() => setLeaveModalOpen(true)}
            >
              Leave space
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <Modal
        header="Are You Sure?"
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
      >
        You&apos;ll no longer be able to edit this Space, and it will be removed
        from your homepage.
        <ModalSubmitButton
          destructive
          content={loading ? "" : "Leave Space"}
          icon={loading ? <DotLoader /> : undefined}
          onClose={() => setLeaveModalOpen(false)}
          onSubmit={async () => {
            if (!spaceID || !authToken || !session) return;
            setLoading(true);
            await workerAPI(WORKER_URL, "leave_space", {
              authToken,
              type: "space",
              do_id: spaceID,
            });
            router.push("/s/" + session.session?.username);
            setLoading(false);
          }}
        />
      </Modal>
    </>
  );
};
