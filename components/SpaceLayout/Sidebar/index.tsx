import Link from "next/link";
import { Divider } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import {
  BackToHome,
  BellSmall,
  Information,
  MoreOptionsSmall,
  RoomCalendar,
  RoomSearch,
  SidebarIcon,
  StudioFilled,
  UnreadDot,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { useRouter } from "next/router";
import { EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import { ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { LogInModal } from "components/LoginModal";
import { useSpaceData } from "hooks/useSpaceData";
import { HelpModal } from "components/HelpCenter";
import { People } from "./People";
import { spaceAPI } from "backend/lib/api";
import { DotLoader } from "components/DotLoader";
import { Feedback } from "components/Feedback";
import { useIsActiveRoom, useRoom, useSetRoom } from "hooks/useUIState";
import { prefetchIdentityData } from "hooks/useIdentityData";
import { ModalSubmitButton, Modal } from "components/Modal";
import { useUIState } from "hooks/useUIState";
import { Truncate } from "components/Truncate";

export const Sidebar = (props: { mobile?: boolean }) => {
  let [roomEditOpen, setRoomEditOpen] = useState(false);
  let setMobileSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);

  return (
    <div className="Sidebar flex h-full w-52 flex-col items-stretch gap-4 overflow-x-visible   text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-scroll px-3 pt-3">
        {props.mobile && (
          <>
            <div className={`spaceName flex w-full bg-white text-grey-35`}>
              <div className="flex w-full flex-row items-start gap-2 ">
                <div className="grow">
                  <SpaceName />
                </div>
                <SpaceOptions />
              </div>
            </div>
            <Divider />
          </>
        )}
        <div className="flex flex-col">
          <UnreadsRoomButton />
          <RoomButton roomID="calendar">
            <RoomCalendar /> Calendar
          </RoomButton>
        </div>
        <Divider />
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
      <People />
      {props.mobile && (
        <div className="flex flex-row justify-between p-2 pt-0 text-grey-55">
          <button onClick={() => setMobileSidebarOpen()}>
            <SidebarIcon />
          </button>
          <LoginOrHome />
        </div>
      )}
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
  let { authorized, memberEntity } = useMutations();
  let unreadCards = db.useReference(memberEntity, "card/unread-by");
  let unreadDiscussions = db.useReference(memberEntity, "discussion/unread-by");
  if (!authorized) return null;

  return (
    <RoomButton roomID="unreads">
      {unreadCards?.length > 0 || unreadDiscussions?.length > 0 ? (
        <div className="absolute -left-1 -top-1">
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
      className={`relative flex w-full items-center gap-1 rounded-md border border-white p-1 ${
        isActiveRoom
          ? "rounded-md border border-accent-blue bg-accent-blue font-bold text-white"
          : "text-grey-35 hover:border hover:border-grey-80"
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

export const SpaceName = (props: { truncate?: boolean }) => {
  let spaceID = useSpaceID();
  let { data } = useSpaceData(spaceID);

  return (
    <div className={`spaceName flex min-w-0 bg-inherit text-grey-35`}>
      {props.truncate ? (
        <Truncate className="w-full max-w-none overflow-hidden bg-inherit">
          <h3 className="SpaceName whitespace-nowrap">{data?.display_name}</h3>
        </Truncate>
      ) : (
        <h3 className="SpaceName whitespace-normal">{data?.display_name}</h3>
      )}
    </div>
  );
};

export const SpaceOptions = () => {
  let spaceID = useSpaceID();
  let { authorized } = useMutations();
  let { data } = useSpaceData(spaceID);
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
          className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue"
        >
          <MoreOptionsSmall className="" />
        </button>
      ) : (
        <MemberOptions />
      )}

      <EditSpaceModal
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
        <Popover.Trigger>
          <button className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue">
            <MoreOptionsSmall className="pt-2" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-20 flex max-w-xs flex-col gap-2 rounded-md border-2 border-grey-80 bg-white py-2 drop-shadow-md"
            sideOffset={-4}
          >
            <Popover.Arrow className="fill-grey-80 stroke-grey-80" />
            <button
              className="px-2 font-bold text-accent-red hover:bg-bg-blue"
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
        You won&apos;t be able to make any changes to this space anymore. It
        will also be removed from your space list.
        <ModalSubmitButton
          destructive
          content={loading ? "" : "Leave Space"}
          icon={loading ? <DotLoader /> : undefined}
          onClose={() => setLeaveModalOpen(false)}
          onSubmit={async () => {
            if (!spaceID || !authToken || !session) return;

            setLoading(true);
            router.push("/s/" + session.session?.username);
            setLoading(false);
          }}
        />
      </Modal>
    </>
  );
};

const LoginOrHome = () => {
  let { session } = useAuth();

  let [infoOpen, setInfoOpen] = useState(false);
  let [logInOpen, setLogInOpen] = useState(false);

  return !session.session?.username ? (
    <div>
      <ButtonPrimary
        content="Log In"
        onClick={() => setLogInOpen(!logInOpen)}
      />
      <LogInModal isOpen={logInOpen} onClose={() => setLogInOpen(false)} />
    </div>
  ) : (
    <Link
      className="hover:text-accent-blue"
      href={`/s/${session.session.username}`}
      onPointerDown={() => {
        if (session.session?.username)
          prefetchIdentityData(session.session.username);
      }}
    >
      <ButtonTertiary
        content={
          <div className="flex flex-row gap-2">
            Back Home <StudioFilled />
          </div>
        }
      />
    </Link>
  );
};
