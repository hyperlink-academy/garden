import useSWR from "swr";

import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { Modal } from "components/Layout";
import { useSmoker } from "components/Smoke";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useState } from "react";
import { DraggableRoomListItem, RoomListLabel } from "./RoomListLayout";
import { AddTiny } from "components/Icons";

export const MemberRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let members = db.useAttribute("member/name");
  let { memberEntity, authorized } = useMutations();
  let auth = useAuth();
  let yourUsername = auth.session.session?.username;

  let [inviteOpen, setInviteOpen] = useState(false);
  return (
    <div className="flex flex-col gap-0.5">
      <RoomListLabel label="Members" />
      <ul className="sidebarMemberRoomList flex flex-col gap-0.5">
        {!memberEntity || !yourUsername ? null : (
          <DraggableRoomListItem
            draggable={false}
            factID={
              members.find((m) => m.entity === memberEntity)?.id as string
            }
            onRoomChange={props.onRoomChange}
            currentRoom={props.currentRoom}
            entityID={memberEntity}
            setRoomEditOpen={() => props.setRoomEditOpen}
          >
            <div className="flex justify-between gap-2">
              <Member entityID={memberEntity} />
              <span className="flex-shrink-0 self-center rounded-md bg-grey-90 px-1 py-0.5 text-xs text-grey-35">
                you
              </span>
            </div>
          </DraggableRoomListItem>
        )}
        {members
          .filter((f) => f.entity !== memberEntity)
          .map((member) => {
            return (
              <DraggableRoomListItem
                factID={member.id}
                draggable={false}
                key={member.id}
                onRoomChange={props.onRoomChange}
                currentRoom={props.currentRoom}
                entityID={member.entity}
                setRoomEditOpen={props.setRoomEditOpen}
              >
                <Member entityID={member.entity} />
              </DraggableRoomListItem>
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

const Member = (props: { entityID: string }) => {
  let activeSessions = db.useEntity(props.entityID, "presence/client-id") || [];
  let memberName = db.useEntity(props.entityID, "member/name");
  return (
    <span className={`${activeSessions?.length > 0 ? "text-accent-blue" : ""}`}>
      {memberName?.value}
    </span>
  );
};

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
