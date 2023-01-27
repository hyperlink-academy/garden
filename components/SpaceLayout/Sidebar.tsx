import Link from "next/link";
import useSWR from "swr";

import { ButtonPrimary } from "components/Buttons";
import { Divider, Modal } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";
import {
  BackToStudio as BackToStudioIcon,
  MoreOptionsSmall,
  MoreOptionsTiny,
} from "../Icons";
import { spaceAPI } from "backend/lib/api";
import { useSmoker } from "components/Smoke";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();
  let { mutate } = useMutations();

  let homeEntity = useIndex.aev("home");
  let rooms = useIndex.aev("room/name");
  let spaceName = useIndex.aev("this/name")[0];

  let [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="roomList flex h-full w-48 flex-col items-stretch gap-4 rounded-l-[3px] border-r border-grey-90 bg-white p-3 text-grey-35">
      <div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-scroll">
        <div className="flex flex-col gap-1 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="px-2">{spaceName?.value}</h3>
            <button className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue">
              <MoreOptionsSmall />
            </button>
          </div>
          <SpaceStatus />
        </div>
        <Divider />
        <div>
          <ul className="flex flex-col gap-0.5">
            <button
              className={`w-full py-0.5 px-2 text-left ${
                homeEntity[0]?.entity === props.currentRoom
                  ? "rounded-md bg-accent-blue  font-bold text-white"
                  : "rounded-md border border-transparent text-grey-35 hover:border-grey-80"
              }`}
              onClick={() => {
                props.onRoomChange(homeEntity[0]?.entity);
              }}
            >
              Home
            </button>

            {rooms.map((room) => {
              return (
                <button
                  className={`flex  w-full items-center justify-between gap-2 overflow-hidden whitespace-nowrap rounded-md py-0.5 px-2 text-left ${
                    room.entity === props.currentRoom
                      ? "rounded-md bg-accent-blue  font-bold text-white"
                      : "border border-transparent text-grey-35 hover:border-grey-80"
                  }`}
                  onClick={() => props.onRoomChange(room.entity)}
                >
                  {room.value}
                  <button
                    className={` rounded-md border border-transparent pt-[1px] hover:border-white ${
                      room.entity === props.currentRoom ? "" : "hidden"
                    }`}
                  >
                    <MoreOptionsTiny />
                  </button>
                </button>
              );
            })}
          </ul>

          <button
            className="hover: flex w-full place-items-center justify-between gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
            onClick={async () => {
              let room = ulid();
              await mutate("assertFact", {
                entity: room,
                attribute: "room/name",
                value: "Untitled Room",
                positions: {},
              });
              props.onRoomChange(room);
            }}
          >
            + room
          </button>
        </div>
        <div className=" pt-4">
          <small className="px-2 font-bold text-grey-55">members</small>
          <div className="w-full border-t border-dashed border-grey-80" />
        </div>
        <div>
          <MemberList {...props} />
          <button
            onClick={() => setInviteOpen(true)}
            className="flex w-full place-items-center gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue  hover:text-accent-blue"
          >
            + invite
          </button>
          <InviteMember
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
          />
        </div>
        <div className=" pt-4">
          <small className="px-2 font-bold text-grey-55">prompt pools</small>
          <div className="w-full border-t border-dashed border-grey-80" />
        </div>

        <button
          onClick={async () => {
            let promptRoom = rooms.find((f) => f.value === "prompts")?.entity;
            if (!promptRoom) {
              promptRoom = ulid();
              await mutate("assertFact", {
                entity: promptRoom,
                attribute: "room/name",
                value: "prompts",
                positions: {},
              });
            }
            console.log(rooms.find((f) => f.value === "prompts"));
            props.onRoomChange(promptRoom);
          }}
        >
          <p>Prompt Pool</p>
        </button>
      </div>
      <div className="mb-2 shrink-0 ">
        <BackToStudio studio={session.session?.username} />
      </div>
    </div>
  );
};

const MemberList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let members = useIndex.aev("member/name");

  return (
    <ul>
      {members.map((member) => (
        <button
          onClick={() => props.onRoomChange(member.entity)}
          className={`flex w-full items-center justify-between gap-2 overflow-hidden whitespace-nowrap rounded-md py-0.5 px-2 text-left ${
            member.entity === props.currentRoom
              ? "rounded-md bg-accent-blue  font-bold text-white"
              : "border border-transparent text-grey-35 hover:border-grey-80"
          }`}
        >
          {member.value}
          <button
            className={` rounded-md border border-transparent pt-[1px] hover:border-white ${
              member.entity === props.currentRoom ? "" : "hidden"
            }`}
          >
            <MoreOptionsTiny />
          </button>
        </button>
      ))}
    </ul>
  );
};

const BackToStudio = (props: { studio?: string }) => {
  if (!props.studio) return <div className="shrink-0" />;

  return (
    <div className="headerBackToStudio z-10 shrink-0 ">
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
      className={`${statusStyles}  flex w-fit gap-2 rounded-md px-2 py-1 text-sm`}
    >
      {status === "unscheduled" ? (
        <Link href="">
          <p>schedule dates</p>
        </Link>
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
      <div className="flex flex-col place-items-center gap-4 p-4  text-center">
        <div>
          <h3>Send this Invite Link!</h3>
          <p>
            Members get thier own room, and can make and edit cards in this
            space.
          </p>
        </div>
        <div className="flex w-full gap-2">
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
