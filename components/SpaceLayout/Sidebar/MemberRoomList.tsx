import useSWR from "swr";

import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { Modal } from "components/Layout";
import { useSmoker } from "components/Smoke";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useState } from "react";
import { RoomListItem, RoomListLabel } from "./RoomListLayout";

export const MemberRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let members = useIndex.aev("member/name");
  let { memberEntity, authorized } = useMutations();
  let [inviteOpen, setInviteOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <RoomListLabel
        label="members"
        helpText={
          <>
            <p>Each member gets their own room.</p>
            <p>Send cards to others' rooms, and they'll see what's new.</p>{" "}
          </>
        }
      />
      <ul className="sidebarMemberRoomList flex flex-col gap-0.5">
        {members
          .filter((f) => f.entity !== memberEntity)
          .map((member) => {
            return (
              <RoomListItem
                key={member.id}
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
