import Link from "next/link";

import { Divider } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import React, { useContext, useState } from "react";
import {
  BackToStudio as BackToStudioIcon,
  MoreOptionsSmall,
} from "../../Icons";
import { useSubscribe } from "replicache-react";
import { EditSpaceModal } from "components/CreateSpace";
import { getCurrentDate } from "src/utils";
import { useRouter } from "next/router";
import { RoomListLabel, RoomListItem, EditRoomModal } from "./RoomListLayout";
import { PromptRoomList } from "./PromptRoomList";
import { SharedRoomList } from "./SharedRoomList";
import { MemberRoomList } from "./MemberRoomList";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();
  let { memberEntity } = useMutations();

  let [roomEditOpen, setRoomEditOpen] = useState(false);
  let rep = useContext(ReplicacheContext);

  let unreadCount = useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!memberEntity) return 0;
      let unreads = 0;
      let cards = await scanIndex(tx).eav(memberEntity, "desktop/contains");
      for (let card of cards) {
        let unread = (
          await scanIndex(tx).eav(card.value.value, "card/unread-by")
        ).find((f) => f.value.value === memberEntity);
        if (unread) unreads += 1;
      }
      return unreads;
    },
    0,
    [memberEntity]
  );

  return (
    <div className="Sidebar pwa-padding flex h-full w-48 flex-col items-stretch gap-4 rounded-l-[3px] border-r border-grey-90 bg-white p-3 text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-4 overflow-y-scroll">
        <SpaceName />
        <Divider />

        <div className="flex flex-col gap-4">
          {!memberEntity ? null : (
            <div className="flex flex-col gap-1">
              <RoomListLabel
                label="your room"
                helpText={
                  <>
                    <p>Your personal workspace.</p>
                    <p>Come back each day and find new things to do!</p>
                  </>
                }
              />
              <RoomListItem
                onRoomChange={props.onRoomChange}
                currentRoom={props.currentRoom}
                unreads={unreadCount}
                roomEntity={memberEntity}
                setRoomEditOpen={() => setRoomEditOpen(true)}
              >
                {session.session?.username}
              </RoomListItem>
            </div>
          )}

          <SharedRoomList
            {...props}
            setRoomEditOpen={() => setRoomEditOpen(true)}
          />

          <div>
            <MemberRoomList
              {...props}
              setRoomEditOpen={() => setRoomEditOpen(true)}
            />
          </div>

          <PromptRoomList
            {...props}
            setRoomEditOpen={() => setRoomEditOpen(true)}
          />
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
    session.session && session.session.username === studio?.value;
  let [editModal, setEditModal] = useState(false);
  return (
    <div className="SidebarSpaceInfo flex flex-col gap-1">
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

  if (
    status === "unscheduled" &&
    session.session &&
    session.session.username === studio?.value
  ) {
    return (
      <button
        onClick={() => props.openEditModal()}
        className={`sidebarSpaceStatus flex w-fit gap-2 rounded-md border border-grey-90 px-2 py-1 text-sm text-grey-55 hover:border-accent-blue hover:text-accent-blue`}
      >
        schedule dates
      </button>
    );
  }
  return (
    <div
      className={`${statusStyles} sidebarSpaceStatus flex w-fit gap-2 rounded-md px-2 py-1 text-sm`}
    >
      <span>{status}</span>
    </div>
  );
};
