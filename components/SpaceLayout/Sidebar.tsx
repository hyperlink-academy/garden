import Link from "next/link";
import useSWR from "swr";

import { ButtonPrimary } from "components/Buttons";
import { Divider, Modal } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { useContext, useEffect, useState } from "react";
import { ulid } from "src/ulid";
import {
  BackToStudio as BackToStudioIcon,
  Delete,
  MoreOptionsSmall,
  MoreOptionsTiny,
} from "../Icons";
import { spaceAPI } from "backend/lib/api";
import { useSmoker } from "components/Smoke";
import { useSubscribe } from "replicache-react";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();
  let { memberEntity } = useMutations();

  let spaceName = useIndex.aev("this/name")[0];
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
    <div className="Sidebar flex h-full w-48 flex-col items-stretch gap-4 rounded-l-[3px] border-r border-grey-90 bg-white p-3 text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-scroll">
        <div className="SidebarSpaceInfo flex flex-col gap-1 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="px-2">{spaceName?.value}</h3>
            <button className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue">
              <MoreOptionsSmall />
            </button>
          </div>
          <SpaceStatus />
        </div>
        <Divider />
        {!memberEntity ? null : (
          <RoomListItem
            onRoomChange={props.onRoomChange}
            currentRoom={props.currentRoom}
            unreads={unreadCount}
            roomEntity={memberEntity}
            setRoomEditOpen={() => setRoomEditOpen(true)}
          >
            Your Room
          </RoomListItem>
        )}
        <Divider />
        <div className=" pt-4">
          <small className="px-2 font-bold text-grey-55">shared</small>
          <div className="w-full border-t border-dashed border-grey-80" />
        </div>
        <RoomList {...props} setRoomEditOpen={() => setRoomEditOpen(true)} />
        <div className=" pt-4">
          <small className="px-2 font-bold text-grey-55">members</small>
          <div className="w-full border-t border-dashed border-grey-80" />
        </div>
        <div>
          <MemberList
            {...props}
            setRoomEditOpen={() => setRoomEditOpen(true)}
          />
        </div>
        <EditRoomModal
          open={roomEditOpen}
          onClose={() => setRoomEditOpen(false)}
          currentRoom={props.currentRoom}
        />

        <PromptRooms {...props} setRoomEditOpen={() => setRoomEditOpen(true)} />
      </div>
      <div className="mb-2 shrink-0 ">
        <BackToStudio studio={session.session?.username} />
      </div>
    </div>
  );
};

const PromptRooms = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let promptRooms = useIndex.aev("promptroom/name");
  let promptRoom = promptRooms.find((f) => f.value == "Prompt Pool");
  let { mutate } = useMutations();
  return (
    <>
      <div className=" pt-4">
        <small className="px-2 font-bold text-grey-55">prompts</small>
        <div className="w-full border-t border-dashed border-grey-80" />
      </div>
      <button
        className={`w-full py-0.5 px-2 text-left ${
          promptRoom?.entity === props.currentRoom
            ? "rounded-md bg-accent-blue  font-bold text-white"
            : "rounded-md border border-transparent text-grey-35 hover:border-grey-80"
        }`}
        onClick={async () => {
          let entity = promptRoom?.entity;
          if (!entity) {
            entity = ulid();
            await mutate("assertFact", {
              entity,
              attribute: "promptroom/name",
              value: "prompts",
              positions: {},
            });
          }
          props.onRoomChange(entity);
        }}
      >
        <p>Prompt Pool</p>
      </button>
      {promptRooms
        .filter((room) => room.value !== "Prompt Pool")
        .map((room) => {
          return (
            <RoomListItem
              onRoomChange={props.onRoomChange}
              currentRoom={props.currentRoom}
              roomEntity={room.entity}
              setRoomEditOpen={props.setRoomEditOpen}
            >
              {room.value || <i>Prompt Room</i>}
            </RoomListItem>
          );
        })}
      <button
        className=" flex w-full place-items-center justify-between gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
        onClick={async () => {
          let room = ulid();
          await mutate("assertFact", {
            entity: room,
            attribute: "promptroom/name",
            value: "",
            positions: {},
          });
          props.onRoomChange(room);
          props.setRoomEditOpen();
        }}
      >
        + room
      </button>
    </>
  );
};

const RoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let { mutate, authorized } = useMutations();
  let { session } = useAuth();
  let homeEntity = useIndex.aev("home");
  let rooms = useIndex.aev("room/name");

  return (
    <ul className="sidebarSharedRoomList flex flex-col gap-0.5">
      <button
        className={`sidebarHomeRoom w-full border border-transparent py-0.5 px-2 text-left ${
          homeEntity[0]?.entity === props.currentRoom
            ? "rounded-md bg-accent-blue font-bold text-white"
            : "rounded-md text-grey-35 hover:border-grey-80"
        }`}
        onClick={() => {
          props.onRoomChange(homeEntity[0]?.entity);
        }}
      >
        Home
      </button>

      {rooms
        .filter((f) => f.value !== "prompts")
        .map((room) => {
          return (
            <RoomListItem
              onRoomChange={props.onRoomChange}
              currentRoom={props.currentRoom}
              roomEntity={room.entity}
              setRoomEditOpen={props.setRoomEditOpen}
            >
              {room.value || <i>Untitled Room</i>}
            </RoomListItem>
          );
        })}
      {!authorized ? null : (
        <button
          className="sidebarAddRoom flex w-full place-items-center justify-between gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
          onClick={async () => {
            let room = ulid();
            await mutate("assertFact", {
              entity: room,
              attribute: "room/name",
              value: "Untitled Room",
              positions: {},
            });
            props.onRoomChange(room);
            props.setRoomEditOpen();
          }}
        >
          + room
        </button>
      )}
    </ul>
  );
};

const MemberList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let members = useIndex.aev("member/name");
  let { memberEntity, authorized } = useMutations();
  let [inviteOpen, setInviteOpen] = useState(false);
  return (
    <ul>
      {members
        .filter((f) => f.entity !== memberEntity)
        .map((member) => {
          return (
            <RoomListItem
              onRoomChange={props.onRoomChange}
              currentRoom={props.currentRoom}
              unreads={undefined}
              roomEntity={member.entity}
              setRoomEditOpen={props.setRoomEditOpen}
            >
              {member?.value}
            </RoomListItem>
          );
        })}
      {!authorized ? null : (
        <>
          <button
            onClick={() => setInviteOpen(true)}
            className="sidebarAddMember flex w-full place-items-center gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue  hover:text-accent-blue"
          >
            + invite
          </button>
          <InviteMember
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
          />
        </>
      )}
    </ul>
  );
};

const RoomListItem: React.FC<
  React.PropsWithChildren<{
    onRoomChange: (room: string) => void;
    unreads?: number;
    currentRoom: string | null;
    roomEntity: string;
    setRoomEditOpen: () => void;
  }>
> = (props) => {
  let { authorized } = useMutations();
  return (
    <div
      className={`flex w-full items-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-transparent  text-left ${
        props.roomEntity === props.currentRoom
          ? "rounded-md bg-accent-blue  font-bold text-white"
          : " text-grey-35 hover:border-grey-80"
      }`}
    >
      <button
        className="sidebarRoomName w-full overflow-clip py-0.5 pl-2 text-left"
        onClick={() => props.onRoomChange(props.roomEntity)}
      >
        {props.children}
      </button>
      {!!props.unreads && props.unreads > 0 && (
        <div className="h-[20px] w-[20px] shrink-0 rounded-full bg-accent-gold">
          {props.unreads}
        </div>
      )}
      {!authorized ? null : (
        <button
          onClick={() => props.setRoomEditOpen()}
          className={`  sidebarRoomOptions mr-2 rounded-md border border-transparent pt-[1px] hover:border-white ${
            props.roomEntity === props.currentRoom ? "" : "hidden"
          }`}
        >
          <MoreOptionsTiny />
        </button>
      )}
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

const SpaceStatus = () => {
  // TODO: get dates + calculate status
  // options: unscheduled, upcoming, ongoing, completed

  // TODO: maybe pass in status as prop - and also in Settings for more detail

  // TEMP EXAMPLE

  let { authorized } = useMutations();
  let status = "unscheduled";

  let statusStyles = "";
  if (status === "unscheduled")
    statusStyles =
      "border border-grey-90 text-grey-55  hover:border-accent-blue hover:text-accent-blue";
  if (status === "upcoming") statusStyles = "text-white bg-grey-15 ";
  if (status === "ongoing") statusStyles = "text-white bg-[green] ";
  if (status === "completed") statusStyles = "text-white bg-grey-35 ";

  return (
    <div
      className={`${statusStyles} sidebarSpaceStatus flex w-fit gap-2 rounded-md px-2 py-1 text-sm`}
    >
      {status === "unscheduled" ? (
        !authorized ? (
          <p>unscheduled</p>
        ) : (
          <Link href="">
            <p>schedule dates</p>
          </Link>
        )
      ) : (
        <span>{status}</span>
      )}
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

const InviteMember = (props: { open: boolean; onClose: () => void }) => {
  let { session } = useAuth();
  let isMember = useIndex.ave("space/member", session.session?.studio);
  let smoker = useSmoker();
  const spaceID = useSpaceID();
  let { data: inviteLink } = useSWR(
    !isMember ? null : `${WORKER_URL}/space/${spaceID}/get_share_code`,
    async () => {
      if (!spaceID || !session.token) return;
      let code = await spaceAPI(
        `${WORKER_URL}/space/${spaceID}`,
        "get_share_code",
        {
          token: session.token,
        }
      );
      if (code.success) {
        return `${document.location.href}/join?code=${code.code}`;
      }
    }
  );

  const getShareLink = async (e: React.MouseEvent) => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    smoker({ position: { x: e.clientX, y: e.clientY }, text: "copied!" });
  };

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div className="inviteMemberModal flex flex-col place-items-center gap-4 p-4 text-center">
        <div className="flex flex-col gap-2">
          <h3>Send this link to invite others to join!</h3>
          <p>
            Members each get their own room, and can create and edit cards in
            this Space.
          </p>
        </div>
        <div className="inviteMemberModalLink flex w-full gap-2">
          <input
            className="grow bg-grey-90 text-grey-35"
            readOnly
            value={inviteLink}
            onClick={getShareLink}
          />
          <ButtonPrimary
            onClick={(e) => getShareLink(e)}
            content={"Copy Invite Link"}
          />
        </div>
      </div>
    </Modal>
  );
};

const EditRoomModal = (props: {
  open: boolean;
  onClose: () => void;
  currentRoom: string | null;
}) => {
  let currentRoom = useIndex.eav(props.currentRoom, "room/name");
  let { mutate } = useMutations();
  let [formState, setFormState] = useState(currentRoom?.value || "");
  useEffect(() => {
    setFormState(currentRoom?.value || "");
  }, [currentRoom?.value]);
  let isMember = !!useIndex.eav(props.currentRoom, "member/name");

  if (!props.currentRoom) return null;
  let entityID = props.currentRoom;

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div className="editRoomModal flex flex-col gap-3 text-grey-35">
        <h3>Room Settings</h3>
        {isMember ? (
          <p className="italic text-grey-55">nothing to edit... yet ;)</p>
        ) : (
          <>
            <div className="editRoomName flex flex-col gap-1">
              <p className="font-bold">Room Name</p>
              <input
                className="w-full"
                value={formState}
                placeholder={currentRoom?.value}
                onChange={(e) => {
                  let value = e.currentTarget.value;
                  setFormState(value);
                }}
              />
            </div>
            <ButtonPrimary
              content="Edit Room!"
              onClick={async () => {
                await mutate("assertFact", {
                  entity: entityID,
                  attribute: "room/name",
                  value: formState,
                  positions: {},
                });
                setFormState("");
                props.onClose();
              }}
            />

            <Divider />
            {isMember ? null : (
              <ButtonPrimary
                destructive
                onClick={async () => {
                  await mutate("deleteEntity", { entity: entityID });
                  setFormState("");
                  props.onClose();
                }}
                content="Delete this room"
                icon={<Delete />}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
