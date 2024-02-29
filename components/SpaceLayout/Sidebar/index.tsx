"use client";
import Link from "next/link";
import { Divider } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BellSmall,
  RoomCalendar,
  RoomSettings,
  Settings,
  SidebarIcon,
  UnreadDot,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { useParams, useRouter } from "next/navigation";
import { EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import { ButtonPrimary } from "components/Buttons";
import { LoginOrSignupModal } from "components/LoginModal";
import { useSpaceData } from "hooks/useSpaceData";
import { People } from "./People";
import { DotLoader } from "components/DotLoader";
import { useIsActiveRoom, useRoom, useSetRoom } from "hooks/useUIState";
import { ModalSubmitButton, Modal } from "components/Modal";
import { useUIState } from "hooks/useUIState";
import { Truncate } from "components/Truncate";
import { SpaceData } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";
import { HelpButton } from "components/Space";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";

export const Sidebar = (props: {
  mobile?: boolean;
  space_id: string;
  studio?: { spaces: SpaceData[]; studioName: string; studioID: string };
}) => {
  let [roomEditOpen, setRoomEditOpen] = useState(false);
  let { session } = useAuth();
  let setMobileSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);

  return (
    <div className="Sidebar text-grey-35 flex h-full w-full grow flex-col items-stretch justify-between gap-2 overflow-x-visible px-3">
      <div className="roomList no-scrollbar flex h-fit w-full flex-col gap-2 overflow-y-scroll">
        <div className="flex flex-col">
          <div className="flex w-full flex-row items-center gap-1 py-0.5 pl-1 pr-0.5 text-left ">
            <RoomSettings /> Settings
          </div>
          <UnreadsRoomButton />
          {/* <RoomButton roomID="calendar">
            <RoomCalendar /> Calendar
          </RoomButton> */}
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

        {/* shared; operates on current room */}
      </div>

      {/* wrapper so both items (people + nav) display at end on mobile */}
      <div className="flex max-h-[50%] flex-col gap-2">
        <People space_id={props.space_id} />
        {props.mobile && (
          <div className="text-grey-55 flex flex-row items-center justify-between p-2 pt-0">
            <button onClick={() => setMobileSidebarOpen()}>
              <SidebarIcon />
            </button>
            <div className="flex gap-2">
              <HelpButton onClick={() => setMobileSidebarOpen(false)} />
              <LoginOrHome space_id={props.space_id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SpaceSwitcher = (props: { spaces: SpaceData[] }) => {
  let router = useRouter();
  let params = useParams<{ space_id: string; studio_id: string }>();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  let spaces = props.spaces.filter((s) => s.archived === activeSpace.archived);
  let index = spaces.findIndex((s) => s.id === params?.space_id);
  return (
    <div className="flex items-center gap-2">
      <button
        className="text-grey-55 hover:text-accent-blue flex items-center gap-0 "
        onClick={() => {
          if (!params) return;
          router.push(
            `/studio/${params.studio_id}/space/${
              //wrap around index - 1
              spaces[(index - 1 + spaces.length) % spaces.length].id
            }`
          );
        }}
      >
        <ArrowUp
          style={{ transform: "rotate(-90deg)" }}
          height={16}
          width={16}
        />
      </button>
      <button
        className="text-grey-55 hover:text-accent-blue flex items-center gap-0"
        onClick={() => {
          if (!params) return;
          router.push(
            `/studio/${params.studio_id}/space/${
              spaces[(index + 1) % spaces.length].id
            }`
          );
        }}
      >
        <ArrowUp
          style={{ transform: "rotate(90deg)" }}
          height={16}
          width={16}
        />
      </button>
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

export const SpaceOptions = (props: { space_id: string }) => {
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
        <button
          onClick={() => {
            setEditModal(true);
            setMobileSidebarOpen(false);
          }}
          className="hover:text-accent-blue shrink-0 rounded-md border border-transparent  pt-[1px]"
        >
          <Settings />
        </button>
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

const LoginOrHome = (props: { space_id: string }) => {
  let { session } = useAuth();
  let [loginOrSignupState, setLoginOrSignupState] =
    LoginOrSignupModal.useState("closed");

  return !session.session?.username ? (
    <div>
      <ButtonPrimary
        content="Log In"
        onClick={() => setLoginOrSignupState("login")}
      />
      <LoginOrSignupModal
        setState={setLoginOrSignupState}
        state={loginOrSignupState}
      />
    </div>
  ) : (
    <SpaceOptions space_id={props.space_id} />
  );
};
