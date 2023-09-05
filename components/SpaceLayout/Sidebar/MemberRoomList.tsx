import useSWR from "swr";

import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { Modal } from "components/Layout";
import { useSmoker } from "components/Smoke";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useContext, useState } from "react";
import { RoomListLabel } from "./RoomListLayout";
import {
  AddTiny,
  CallMutedTiny,
  CallUnMutedTiny,
  RoomMember,
} from "components/Icons";
import { useParticipant, useParticipantIds } from "@daily-co/daily-react";

export const MemberRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let members = db.useAttribute("member/name");
  let { authorized } = useMutations();

  let [inviteOpen, setInviteOpen] = useState(false);
  return (
    <div className="flex flex-col gap-0.5">
      <RoomListLabel label="Members" />
      <ul className="sidebarMemberRoomList flex flex-col gap-0.5">
        {members.map((member) => {
          return (
            <MemberRoom
              key={member.id}
              onRoomChange={props.onRoomChange}
              currentRoom={props.currentRoom}
              entityID={member.entity}
              memberName={member.value}
            />
          );
        })}
        {!authorized ? null : (
          <>
            <button
              onClick={() => setInviteOpen(true)}
              className="sidebarAddMember group flex w-full items-center gap-2 rounded-md border border-transparent py-0.5 px-1 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
            >
              <div className="text-grey-80 group-hover:text-accent-blue">
                <AddTiny />
              </div>
              invite
            </button>
            <InviteMember
              open={inviteOpen}
              onClose={() => setInviteOpen(false)}
            />
          </>
        )}
      </ul>
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

const MemberRoom = (props: {
  entityID: string;
  memberName: string;
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let activeSessions =
    db.useReference(props.entityID, "presence/client-member") || [];
  let color = db.useEntity(props.entityID, "member/color");
  let participant = useParticipantInCall(props.memberName);

  let bgColor = participant
    ? participant.tracks.audio.state === "playable"
      ? "bg-accent-green"
      : "bg-grey-55"
    : "bg-accent-blue";

  let textColor =
    participant && participant.tracks.audio.state === "playable"
      ? "text-accent-green"
      : "text-grey-35";

  let { memberEntity } = useMutations();

  return (
    <button
      style={{
        color:
          props.entityID === props.currentRoom
            ? "white"
            : activeSessions.length > 0
            ? color?.value
            : undefined,
        backgroundColor:
          props.entityID === props.currentRoom
            ? activeSessions.length > 0
              ? color?.value
              : "#0000FF"
            : undefined,
      }}
      onClick={() => props.onRoomChange(props.entityID)}
      className={`relative flex select-none flex-row gap-1 rounded-md border border-transparent py-0.5 pl-1 pr-1 text-left ${
        props.entityID === props.currentRoom
          ? `rounded-md font-bold text-white`
          : ` hover:border-grey-80`
      }`}
    >
      <div
        className="mt-[2px] h-5 w-5 shrink-0 pt-[1px] pl-[2px]"
        style={{
          color:
            participant && participant.tracks.audio.state !== "playable"
              ? "#595959"
              : undefined,
        }}
      >
        {!participant ? (
          <RoomMember />
        ) : participant.tracks.audio.state === "playable" ? (
          <CallUnMutedTiny />
        ) : (
          <CallMutedTiny />
        )}
      </div>
      <div className="flex w-full flex-row justify-between">
        <div>{props.memberName}</div>
        <div>
          {props.entityID === memberEntity ? (
            <div className="flex-shrink-0 self-center rounded-md bg-grey-90 px-1 py-0.5 text-xs text-grey-35">
              you
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
};

function useParticipantInCall(username: string) {
  let id = useParticipantIds({
    filter: (participant) => participant.user_name === username,
  });
  return useParticipant(id[0]);
}

const InviteMember = (props: { open: boolean; onClose: () => void }) => {
  let { authToken, session } = useAuth();
  let isMember = db.useUniqueAttribute("space/member", session.session?.studio);
  let smoker = useSmoker();
  const spaceID = useSpaceID();
  let { data: inviteLink } = useSWR(
    !isMember ? null : `${WORKER_URL}/space/${spaceID}/get_share_code`,
    async () => {
      if (!spaceID || !authToken) return;
      let code = await spaceAPI(
        `${WORKER_URL}/space/${spaceID}`,
        "get_share_code",
        { authToken }
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
