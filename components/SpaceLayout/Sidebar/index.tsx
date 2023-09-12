import Link from "next/link";
import { Divider } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
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
import { ButtonPrimary } from "components/Buttons";
import { LogInModal } from "components/LoginModal";
import { useSpaceData } from "hooks/useSpaceData";
import { useIdentityData } from "hooks/useIdentityData";
import { uuidToBase62 } from "src/uuidHelpers";
import { HelpModal } from "components/HelpCenter";
import { People } from "./People";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();

  let [roomEditOpen, setRoomEditOpen] = useState(false);

  return (
    <div className="Sidebar pwa-padding flex h-full w-52 flex-col items-stretch gap-4 overflow-x-visible rounded-l-[3px] border-r border-grey-90 bg-white  text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-4 overflow-y-scroll px-3 pt-3">
        <SpaceName />
        <People />
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
  let { data } = useSpaceData(spaceID);
  let router = useRouter();
  let { session } = useAuth();
  let authorized =
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
        {authorized && (
          <button
            onClick={() => setEditModal(true)}
            className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue"
          >
            <MoreOptionsSmall />
          </button>
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

      {/* studio list! */}
      {authorized && session.session && (
        <SpaceStudiosList username={session.session.username} />
      )}

      {/* info / help button */}
      <button
        className="hover:text-accent-blue"
        onClick={() => setInfoOpen(true)}
      >
        <Information />
      </button>
      <HelpModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
};

const SpaceStudiosList = (props: { username: string }) => {
  let { data } = useIdentityData(props.username);
  let studios = data?.members_in_studios.map(
    (s) => s.studios as Exclude<typeof s.studios, null>
  );
  return studios && studios.length > 0 ? (
    <>
      <PopoverRadix.Root>
        <PopoverRadix.Trigger>
          <button className="font-bold text-grey-35 hover:text-accent-blue">
            Studios
          </button>
        </PopoverRadix.Trigger>

        <PopoverRadix.Portal>
          <PopoverRadix.Content
            className="relative left-2 z-20 flex max-w-xs flex-col gap-2 rounded-md border-2 border-grey-80 bg-white p-2 drop-shadow-md"
            sideOffset={4}
          >
            <PopoverRadix.Arrow
              className="fill-grey-80 stroke-grey-80"
              offset={20}
              startOffset={20}
            />

            {studios?.map((s) => (
              <Link href={`/studio/${uuidToBase62(s.id)}`} key={s.id}>
                <PopoverRadix.Close className="w-full py-1 px-2 text-left text-grey-35 hover:bg-bg-blue">
                  {s.name}
                </PopoverRadix.Close>
              </Link>
            ))}
          </PopoverRadix.Content>
        </PopoverRadix.Portal>
      </PopoverRadix.Root>
    </>
  ) : null;
};
