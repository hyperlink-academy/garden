import Link from "next/link";

import { Divider } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations } from "hooks/useReplicache";
import React, { Fragment, useState } from "react";
import {
  BackToStudio as BackToStudioIcon,
  MoreOptionsSmall,
} from "../../Icons";
import { EditSpaceModal } from "components/CreateSpace";
import { getCurrentDate } from "src/utils";
import { useRouter } from "next/router";
import { RoomListLabel, RoomListItem, EditRoomModal } from "./RoomListLayout";
import { SharedRoomList } from "./SharedRoomList";
import { MemberRoomList } from "./MemberRoomList";
import { Popover } from "@headlessui/react";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();
  let { memberEntity } = useMutations();

  let [roomEditOpen, setRoomEditOpen] = useState(false);

  return (
    <div className="Sidebar pwa-padding flex h-full w-52 flex-col items-stretch gap-4 rounded-l-[3px] border-r border-grey-90 bg-white p-3 text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-4 overflow-y-scroll">
        <SpaceName />
        <Divider />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {!memberEntity ? null : (
              <>
                <RoomListItem
                  onRoomChange={props.onRoomChange}
                  currentRoom={props.currentRoom}
                  roomEntity={memberEntity}
                  setRoomEditOpen={() => setRoomEditOpen(true)}
                >
                  Your Room
                </RoomListItem>
                <div className="w-full border-t border-dashed border-grey-80" />
              </>
            )}

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
      <div className="mb-2 shrink-0 ">
        <BackToStudio studio={session.session?.username} />
      </div>
    </div>
  );
};
const SpaceName = () => {
  let spaceName = useIndex.aev("this/name")[0];
  let studio = useIndex.eav(spaceName?.entity, "space/studio");
  let router = useRouter();
  let { session } = useAuth();
  let authorized =
    session.session &&
    session.session.username === studio?.value.toLocaleLowerCase();
  let [editModal, setEditModal] = useState(false);
  return (
    <div className="SidebarSpaceInfo flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="">{spaceName?.value}</h3>
        {authorized && (
          <button
            onClick={() => setEditModal(true)}
            className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue"
          >
            <MoreOptionsSmall />
          </button>
        )}
      </div>
      <SpaceStatus
        entityID={spaceName?.entity}
        openEditModal={() => setEditModal(true)}
      />
      <EditSpaceModal
        open={editModal}
        onDelete={() => {
          if (!session.session) return;
          router.push(`/s/${session.session.username}`);
        }}
        onClose={() => setEditModal(false)}
        spaceEntity={spaceName?.entity}
      />
    </div>
  );
};

const BackToStudio = (props: { studio?: string }) => {
  if (!props.studio) return <div className="shrink-0" />;

  return (
    <div className="sidebarBackToStudio z-10 shrink-0 ">
      <Link
        className="flex place-items-center gap-2 rounded-md border border-transparent px-2 py-1 hover:border-accent-blue  hover:text-accent-blue"
        href={`/s/${props.studio}`}
      >
        <BackToStudioIcon /> To Studio
      </Link>
    </div>
  );
};

const SpaceStatus = (props: {
  entityID: string;
  openEditModal: () => void;
}) => {
  let start_date = useIndex.eav(props.entityID, "space/start-date")?.value
    .value;
  let end_date = useIndex.eav(props.entityID, "space/end-date")?.value.value;

  let studio = useIndex.eav(props.entityID, "space/studio");
  let { session } = useAuth();
  let status: "unscheduled" | "ongoing" | "upcoming" | "completed" =
    "unscheduled";

  // NB: same calculation as SpacesList.tsx
  // + adding current_day and space_progress
  let duration_days = undefined;
  let current_day = undefined;
  let space_progress = undefined;
  let now_timestamp = new Date(getCurrentDate()).getTime();

  if (start_date && end_date) {
    let start_timestamp = new Date(start_date).getTime();
    let end_timestamp = new Date(end_date).getTime();
    let delta_duration = Math.abs(end_timestamp - start_timestamp) / 1000;
    let delta_now = Math.abs(now_timestamp - start_timestamp) / 1000;
    duration_days = Math.floor(delta_duration / 86400) + 1;
    current_day = Math.floor(delta_now / 86400) + 1;
    space_progress = (current_day / duration_days) * 100; // calc as percent
  }

  // date logic - this should match studio index.tsx
  if (
    // start in past + end missing or in future
    (start_date &&
      start_date <= getCurrentDate() &&
      (!end_date || end_date >= getCurrentDate())) ||
    // OR no start + future end date
    (!start_date && end_date && end_date >= getCurrentDate())
  )
    status = "ongoing";

  if (start_date && start_date > getCurrentDate()) status = "upcoming";

  if (end_date && end_date < getCurrentDate()) status = "completed";

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
    session.session.username === studio?.value.toLocaleLowerCase()
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
  if (status === "ongoing")
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
