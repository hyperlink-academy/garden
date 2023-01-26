import Link from "next/link";

import { ButtonLink } from "components/Buttons";
import { SingleTextSection } from "components/CardView/Sections";
import { Divider } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";
import { AddTiny, BackToStudio as BackToStudioIcon, MemberAdd } from "../Icons";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let { session } = useAuth();

  let homeEntity = useIndex.aev("home");
  let rooms = useIndex.aev("room/name");
  let spaceName = useIndex.aev("this/name")[0];

  let { mutate } = useMutations();
  return (
    <div className="roomList flex h-full w-48 flex-col items-stretch gap-4 rounded-l-[3px] border-r border-grey-90 bg-white p-3 text-grey-35">
      <div className="flex h-full w-full flex-col gap-2 overflow-y-scroll">
        <div className="flex flex-col gap-1 pb-2">
          <h3 className="px-2">{spaceName?.value}</h3>
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
                  className={`w-full items-start justify-start overflow-hidden whitespace-nowrap rounded-md py-0.5 px-2 text-left ${
                    room.entity === props.currentRoom
                      ? "rounded-md bg-accent-blue  font-bold text-white"
                      : "border border-transparent text-grey-35 hover:border-grey-80"
                  }`}
                  onClick={() => props.onRoomChange(room.entity)}
                >
                  {room.value}
                </button>
              );
            })}
          </ul>

          <button
            className="flex place-items-center justify-between gap-1 py-0.5 px-2 hover:italic"
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
            {/* <AddTiny /> */}
          </button>
        </div>
        <div className="-mb-2 pt-4">
          <div className="w-full border-t border-dashed border-grey-80" />
          <small className="px-2 font-bold text-grey-55">members</small>
        </div>
        <div>
          <MemberList />
          <button className="flex place-items-center gap-1 py-0.5 px-2 hover:italic">
            invite <MemberAdd />
          </button>
        </div>
      </div>
      <div className="mb-2 shrink-0 ">
        <BackToStudio studio={session.session?.username} />
      </div>
    </div>
  );
};

const MemberList = () => {
  let members = useIndex.aev("member/name");

  return (
    <ul>
      {members.map((member) => (
        <li
          className={`w-full items-start justify-start overflow-hidden whitespace-nowrap rounded-md border border-transparent py-0.5 px-2 text-left text-grey-35 hover:border-grey-80`}
        >
          {member.value}
        </li>
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
