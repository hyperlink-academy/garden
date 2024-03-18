"use client";
import { Divider } from "components/Layout";
import { HelpButton, SpaceRoleBadge } from "components/Space";
import { Sidebar } from "components/SpaceLayout";
import { SearchResults, useSearch } from "components/Search";
import {
  RoomCanvas,
  RoomChat,
  RoomCollection,
  RoomMember,
  RoomSearch,
  Settings,
} from "components/Icons";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { SidebarTab } from "./SidebarTab";
import { useRoom, useSetRoom, useUIState } from "hooks/useUIState";
import { People } from "components/SpaceLayout/Sidebar/People";
import { useSpaceData } from "hooks/useSpaceData";
import { EditSpaceModal } from "components/CreateSpace";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { workerAPI } from "backend/lib/api";
import { DotLoader } from "components/DotLoader";
import { Modal, ModalSubmitButton } from "components/Modal";
import { WORKER_URL } from "src/constants";
import { useSidebarState } from "./SidebarState";

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
  do_id: string;
}) {
  let { input, setInput, results } = useSearch();
  let { open } = useSidebarState();
  if (!open) return <CollapsedSpaceSidebar space_id={props.space_id} />;
  return (
    <div className="flex h-full flex-col">
      <div className="sidebarSpaceContent flex h-full min-h-0 shrink grow flex-col ">
        <div className="flex items-center justify-between px-3 pt-3">
          <div className="sidebarRolebadgeWrapper shrink-0">
            <SpaceRoleBadge space_id={props.space_id} />
          </div>
          <div className="flex gap-1">
            <HelpButton />
            <SpaceSettings space_id={props.space_id} />
          </div>
        </div>
        <div className="divider shrink-0 py-3">
          <Divider />
        </div>
        <div className="sidebarSearchWrapper px-3 pb-2">
          <input
            id="sidebar-search"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            placeholder="search space (ctrl/⌘ K)"
            className="sidebarSearch w-full px-2 py-1 text-sm outline-none"
          />
        </div>

        {input === "" ? (
          <Sidebar space_id={props.space_id} />
        ) : (
          <SearchResults
            results={results}
            onClick={() => {}}
            suggestionIndex={0}
          />
        )}
      </div>
      <div className="sidebarPeoplePanel sticky bottom-0 h-fit max-h-[40%] shrink-0 overflow-y-scroll bg-white px-3 pb-3 ">
        <div className="divider pb-1 ">
          <Divider />
        </div>
        <People space_id={props.space_id} />
      </div>
    </div>
  );
}

export const CollapsedSpaceSidebar = (props: { space_id: string }) => {
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));
  let { setSidebar } = useSidebarState();

  let spaceData = useSpaceData(props);

  let members = db
    .useAttribute("member/name")
    .filter((m) =>
      spaceData?.data?.members_in_spaces.find(
        (f) => f.identity_data?.username === m.value
      )
    );
  let activeSessions = db
    .useAttribute("presence/client-member")
    .map((m) => m.value.value);
  let uniqueSessions = new Set(activeSessions);

  let membersOnline = members.filter((f) => uniqueSessions.has(f.entity));

  let membersInCall = db.useAttribute("presence/in-call");
  console.log(membersInCall);

  return (
    <div className="flex h-full flex-col gap-1 text-accent-blue">
      <div className="w-full pb-1 pt-3">
        <Divider />
      </div>

      <SidebarTab
        icon={<RoomSearch />}
        title="Search"
        collapsed
        active={false}
        onClick={() => {
          setSidebar(true);
          setTimeout(() => {
            document.getElementById("sidebar-search")?.focus();
          }, 50);
        }}
      />
      <div className="z-50 flex grow flex-col gap-1 pb-3 text-grey-55">
        {rooms.map((r) => (
          <RoomButton key={r.entity} entityID={r.entity} />
        ))}
      </div>
      {membersOnline.length > 0 && (
        <div
          className={`collapsedSidebarPeople sticky bottom-0 mx-auto flex w-full flex-col place-items-center gap-1 rounded-md bg-white pb-3  text-center font-bold `}
        >
          <Divider />
          <div
            className={` rounded-md p-1 pt-2 text-white ${
              membersInCall.length === 0 ? "bg-accent-blue" : "bg-grey-55"
            }`}
          >
            <RoomMember /> {membersOnline.length}
          </div>
        </div>
      )}
    </div>
  );
};

const RoomButton = (props: { entityID: string }) => {
  let roomType = db.useEntity(props.entityID, "room/type");
  let setRoom = useSetRoom();
  let room = useRoom();
  return (
    <SidebarTab
      title=""
      active={room === props.entityID}
      collapsed
      onClick={() => {
        setRoom(props.entityID);
      }}
      icon={
        roomType?.value === "canvas" ? (
          <RoomCanvas />
        ) : roomType?.value === "chat" ? (
          <RoomChat />
        ) : (
          <RoomCollection />
        )
      }
    />
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
        <button
          className={`text-grey-55 hover:text-accent-blue`}
          onClick={() => {
            setEditModal(true);
            setMobileSidebarOpen(false);
          }}
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
        <Popover.Trigger className="text-grey-55 hover:text-accent-blue">
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
