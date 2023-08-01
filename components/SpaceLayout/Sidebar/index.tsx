import Link from "next/link";
import { Divider, Modal } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import React, { Fragment, useState } from "react";
import {
  BackToHome,
  Information,
  MoreOptionsSmall,
  RoomCalendar,
  RoomSearch,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { getCurrentDate } from "src/utils";
import { useRouter } from "next/router";
import { EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import { MemberRoomList } from "./MemberRoomList";
import { Popover } from "@headlessui/react";
import * as PopoverRadix from "@radix-ui/react-popover";
import { ButtonPrimary } from "components/Buttons";
import { LogInModal } from "components/LoginModal";
import { useSpaceData } from "hooks/useSpaceData";
import { useIdentityData } from "hooks/useIdentityData";
import { uuidToBase62 } from "src/uuidHelpers";
import { HelpModal } from "components/HelpCenter";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();
  let [roomEditOpen, setRoomEditOpen] = useState(false);

  return (
    <div className="Sidebar pwa-padding flex h-full w-52 flex-col items-stretch gap-4 rounded-l-[3px] border-r border-grey-90 bg-white p-3 text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-4 overflow-y-scroll">
        <SpaceName />
        <Divider />
        <div className="flex flex-row content-between gap-2 pl-2">
          <button
            className={`flex  w-full justify-center rounded-md border  p-1 ${
              props.currentRoom === "search"
                ? "rounded-md border-accent-blue bg-accent-blue font-bold text-white"
                : " border-grey-80 text-grey-35 hover:bg-bg-blue"
            }`}
            onClick={() => props.onRoomChange("search")}
          >
            <RoomSearch />
          </button>

          <button
            className={`flex  w-full justify-center rounded-md border  p-1 ${
              props.currentRoom === "calendar"
                ? "rounded-md border-accent-blue bg-accent-blue font-bold text-white"
                : " border-grey-80 text-grey-35 hover:bg-bg-blue"
            }`}
            onClick={() => props.onRoomChange("calendar")}
          >
            <RoomCalendar />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <SharedRoomList
              {...props}
              setRoomEditOpen={() => setRoomEditOpen(true)}
            />
          </div>

          <div>
            <MemberRoomList
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
      <SpaceStatus openEditModal={() => setEditModal(true)} />
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
    <div className="sidebarBackToHome z-10 flex items-center justify-between gap-2 ">
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

export const SpaceStatus = (props: { openEditModal: () => void }) => {
  let id = useSpaceID();
  let { data } = useSpaceData(id);

  let { session } = useAuth();
  let status: "unscheduled" | "ongoing" | "upcoming" | "completed" =
    "unscheduled";

  // NB: same calculation as SpacesList.tsx
  // + adding current_day and space_progress
  let duration_days = undefined;
  let current_day = undefined;
  let space_progress = undefined;
  let now_timestamp = new Date(getCurrentDate()).getTime();

  if (data?.start_date && data?.end_date) {
    let start_timestamp = new Date(data.start_date).getTime();
    let end_timestamp = new Date(data.end_date).getTime();
    let delta_duration = Math.abs(end_timestamp - start_timestamp) / 1000;
    let delta_now = Math.abs(now_timestamp - start_timestamp) / 1000;
    duration_days = Math.floor(delta_duration / 86400) + 1;
    current_day = Math.floor(delta_now / 86400) + 1;
    space_progress = (current_day / duration_days) * 100; // calc as percent
  }

  // date logic - this should match studio index.tsx
  if (
    // start in past + end missing or in future
    (data?.start_date &&
      data?.start_date <= getCurrentDate() &&
      (!data?.end_date || data?.end_date >= getCurrentDate())) ||
    // OR no start + future end date
    (!data?.start_date && data?.end_date && data?.end_date >= getCurrentDate())
  )
    status = "ongoing";

  if (data?.start_date && data?.start_date > getCurrentDate())
    status = "upcoming";

  if (data?.end_date && data?.end_date < getCurrentDate()) status = "completed";

  let statusStyles = "";
  if (status === "unscheduled")
    statusStyles = "border border-grey-90 text-grey-55  ";
  if (status === "upcoming") statusStyles = "text-white bg-grey-15 ";
  if (status === "ongoing") statusStyles = "text-white bg-[green] ";
  if (status === "completed") statusStyles = "text-white bg-grey-35 ";

  // unscheduled and your studio - prompt adding dates
  if (
    status === "unscheduled" &&
    session.session &&
    session.session.username === data?.owner.username
  )
    return (
      <button
        onClick={() => props.openEditModal()}
        className={`sidebarSpaceStatus flex w-fit gap-2 rounded-md border border-grey-90 px-2 py-1 text-sm text-grey-55 hover:border-accent-blue hover:text-accent-blue`}
      >
        schedule dates
      </button>
    );

  // ongoing - just show progress bar
  if (status === "ongoing" && data?.start_date && data?.end_date)
    return (
      <Popover className="w-full cursor-pointer">
        <Popover.Button as={Fragment}>
          <div
            title={`day ${current_day} of ${duration_days}`}
            className="spaceProgress h-4 w-full rounded-md bg-grey-35"
          >
            <div
              className="h-4 rounded-md border border-grey-35 bg-accent-gold"
              style={{ width: `${space_progress}%` }}
            ></div>
          </div>
        </Popover.Button>
        <div className="absolute z-10">
          <Popover.Panel className="lightBorder z-50 mt-1 flex gap-2 bg-white p-2 text-sm text-grey-35">
            {`day ${current_day} of ${duration_days}`}
          </Popover.Panel>
        </div>
      </Popover>
    );

  // otherwise show status - 'upcoming' or 'completed'
  return (
    <div
      className={`${statusStyles} sidebarSpaceStatus flex w-fit gap-2 rounded-md px-2 py-1 text-sm`}
    >
      <span>{status}</span>
    </div>
  );
};
