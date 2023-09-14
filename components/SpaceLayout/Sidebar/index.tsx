import Link from "next/link";
import { Divider, Modal } from "components/Layout";
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
  UnreadDot,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { useRouter } from "next/router";
import { EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import * as PopoverRadix from "@radix-ui/react-popover";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { LogInModal } from "components/LoginModal";
import { useSpaceData } from "hooks/useSpaceData";
import { useIdentityData } from "hooks/useIdentityData";
import { uuidToBase62 } from "src/uuidHelpers";
import { HelpModal } from "components/HelpCenter";
import { People } from "./People";
import { spaceAPI } from "backend/lib/api";
import { DotLoader } from "components/DotLoader";
import { Feedback } from "components/Feedback";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();

  let [roomEditOpen, setRoomEditOpen] = useState(false);

  return (
    <div className="Sidebar pwa-padding flex h-full w-52 flex-col items-stretch gap-4 overflow-x-visible rounded-l-[3px] border-r border-grey-90 bg-white  text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-scroll px-3 pt-3">
        <div className="flex flex-col gap-0">
          <SpaceName />
          <People />
        </div>
        <Divider />
        <div className="flex flex-row content-between gap-2 ">
          <RoomButton {...props} roomID="search">
            <RoomSearch />
          </RoomButton>

          <RoomButton {...props} roomID="calendar">
            <RoomCalendar />
          </RoomButton>

          <UnreadsRoomButton {...props} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <SharedRoomList
              {...props}
              setRoomEditOpen={() => setRoomEditOpen(true)}
            />
          </div>
        </div>

        {/* shared; operates on current room */}
        <EditRoomModal
          open={roomEditOpen}
          onClose={() => setRoomEditOpen(false)}
          currentRoom={props.currentRoom}
        />
      </div>
      <SidebarFooter studio={session.session?.username} />
    </div>
  );
};

const UnreadsRoomButton = (props: {
  currentRoom: string | null;
  onRoomChange: (room: string) => void;
}) => {
  let { authorized, memberEntity } = useMutations();
  let unreadCards = db.useReference(memberEntity, "card/unread-by");
  let unreadDiscussions = db.useReference(memberEntity, "discussion/unread-by");
  if (!authorized) return null;

  return (
    <RoomButton {...props} roomID="unreads">
      {unreadCards?.length > 0 || unreadDiscussions?.length > 0 ? (
        <div className="absolute -top-1 -left-1">
          <UnreadDot />
        </div>
      ) : null}
      <BellSmall />
    </RoomButton>
  );
};

const RoomButton = (props: {
  roomID: string;
  currentRoom: string | null;
  children: React.ReactNode;
  onRoomChange: (room: string) => void;
}) => {
  return (
    <button
      className={`relative flex w-full justify-center rounded-md border p-1 ${
        props.currentRoom === props.roomID
          ? "rounded-md border-accent-blue bg-accent-blue font-bold text-white"
          : " border-grey-80 text-grey-35 hover:bg-bg-blue"
      }`}
      onClick={() => props.onRoomChange(props.roomID)}
    >
      {props.children}
    </button>
  );
};
const SpaceName = () => {
  let spaceID = useSpaceID();
  let { authorized } = useMutations();
  let { data } = useSpaceData(spaceID);
  let router = useRouter();
  let { session } = useAuth();
  let isOwner =
    session.session && session.session.username === data?.owner.username;
  let [editModal, setEditModal] = useState(false);
  return (
    <div className="SidebarSpaceInfo flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3
          className="SpaceName"
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {data?.display_name}
        </h3>
        {!authorized ? null : isOwner ? (
          <button
            onClick={() => setEditModal(true)}
            className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue"
          >
            <MoreOptionsSmall />
          </button>
        ) : (
          <MemberOptions />
        )}
      </div>
      <EditSpaceModal
        open={editModal}
        onDelete={() => {
          if (!session.session) return;
          router.push(`/s/${session.session.username}`);
        }}
        onClose={() => setEditModal(false)}
        spaceID={spaceID}
      />
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
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
          <button>
            <MoreOptionsSmall />
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
      <Modal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)}>
        <h3>Are you sure you want to leave this space?</h3>
        <div className="flex flex-row gap-2">
          <ButtonPrimary
            destructive
            content={loading ? <DotLoader /> : "Leave"}
            onClick={async () => {
              if (!spaceID || !authToken || !session) return;

              setLoading(true);
              let data = await spaceAPI(
                `${WORKER_URL}/space/${spaceID}`,
                "leave",
                {
                  authToken,
                }
              );
              router.push("/s/" + session.session?.username);
              setLoading(false);
            }}
          />
          <ButtonSecondary
            content="Nevermind"
            onClick={() => setLeaveModalOpen(false)}
          />
        </div>
      </Modal>
    </>
  );
};

const SidebarFooter = (props: { studio?: string }) => {
  let { session } = useAuth();
  let authorized = session.loggedIn;

  let [infoOpen, setInfoOpen] = useState(false);
  let [logInOpen, setLogInOpen] = useState(false);

  return (
    <div className="sidebarBackToHome z-10 flex items-center justify-between gap-2 px-3 pb-3">
      {/* login OR home button + studios */}
      {!props.studio ? (
        <div className="grow">
          <ButtonPrimary
            content="Log In"
            onClick={() => setLogInOpen(!logInOpen)}
          />
          <LogInModal isOpen={logInOpen} onClose={() => setLogInOpen(false)} />
        </div>
      ) : (
        <Link className="hover:text-accent-blue" href={`/s/${props.studio}`}>
          <BackToHome />
        </Link>
      )}

      <div className="flex flex-row gap-2">
        <Feedback />

        {/* info / help button */}
        <button
          className="hover:text-accent-blue"
          onClick={() => setInfoOpen(true)}
        >
          <Information />
        </button>
        <HelpModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      </div>
    </div>
  );
};
