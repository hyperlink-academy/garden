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
  MoreOptionsSmall,
  RoomCalendar,
  Settings,
  SidebarIcon,
  UnreadDot,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { useParams, useRouter } from "next/navigation";
import { EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import { ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { LoginOrSignupModal } from "components/LoginModal";
import { useSpaceData } from "hooks/useSpaceData";
import { People } from "./People";
import { DotLoader } from "components/DotLoader";
import { useIsActiveRoom, useRoom, useSetRoom } from "hooks/useUIState";
import { ModalSubmitButton, Modal } from "components/Modal";
import { useUIState } from "hooks/useUIState";
import { Truncate } from "components/Truncate";
import router from "next/router";
import { HelpButton } from "pages/s/[studio]/s/[space]";
import { SpaceData } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";

export const Sidebar = (props: {
  mobile?: boolean;
  studio?: { spaces: SpaceData[]; studioName: string; studioID: string };
}) => {
  let [roomEditOpen, setRoomEditOpen] = useState(false);
  let { session } = useAuth();
  let setMobileSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);

  return (
    <div className="Sidebar flex h-full w-52 flex-col items-stretch gap-4 overflow-x-visible   text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-scroll px-3 pt-3">
        {props.mobile && (
          <>
            <div
              className={`spaceName flex w-full flex-col bg-white text-grey-35`}
            >
              {props.studio ? (
                <div className="flex justify-between">
                  <Link
                    prefetch
                    href={`/studio/${uuidToBase62(props.studio.studioID)}`}
                  >
                    <div className="-mb-0.5  text-sm font-bold text-grey-55">
                      {props.studio.studioName}
                    </div>
                  </Link>
                  <SpaceSwitcher spaces={props.studio?.spaces} />
                </div>
              ) : (
                <Link
                  href={
                    session.session ? `/s/${session.session.username}` : "/"
                  }
                  className="-mb-0.5  text-sm font-bold text-grey-55"
                >
                  <ArrowDown className="rotate-90" height={16} width={16} />{" "}
                  home
                </Link>
              )}

              <div className="flex w-full flex-row items-start gap-2 ">
                <div className="grow">
                  <SpaceName />
                </div>
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
        <div className="flex flex-row items-center justify-between p-2 pt-0 text-grey-55">
          <button onClick={() => setMobileSidebarOpen()}>
            <SidebarIcon />
          </button>
          <div className="flex gap-2">
            <HelpButton />
            <LoginOrHome />
          </div>
        </div>
      )}
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
        className="flex items-center gap-0 text-grey-55 hover:text-accent-blue "
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
        className="flex items-center gap-0 text-grey-55 hover:text-accent-blue"
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
  let { authorized, memberEntity } = useMutations();
  let unreadCards = db.useReference(memberEntity, "card/unread-by");
  let unreadDiscussions = db.useReference(memberEntity, "discussion/unread-by");
  if (!authorized) return null;

  return (
    <RoomButton roomID="unreads">
      {unreadCards?.length > 0 || unreadDiscussions?.length > 0 ? (
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
        <h4 className="SpaceName whitespace-normal">{data?.display_name}</h4>
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
          className="shrink-0 rounded-md border border-transparent pt-[1px]  hover:text-accent-blue"
        >
          <Settings />
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
        <Popover.Trigger className="shrink-0 rounded-md border border-transparent pt-[1px]  hover:text-accent-blue">
          <Settings />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 flex max-w-xs flex-col gap-2 rounded-md border border-grey-80 bg-white py-2 drop-shadow-md"
            sideOffset={4}
          >
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
    <SpaceOptions />
    // <Link
    //   className="hover:text-accent-blue"
    //   href={`/s/${session.session.username}`}
    //   onPointerDown={() => {
    //     if (session.session?.username)
    //       prefetchIdentityData(session.session.username);
    //   }}
    // >
    //   <ButtonTertiary
    //     content={
    //       <div className="flex flex-row gap-2">
    //         Back Home <StudioFilled />
    //       </div>
    //     }
    //   />
    // </Link>
  );
};
