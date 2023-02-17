import useSWR from "swr";

import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { Modal } from "components/Layout";
import { useSmoker } from "components/Smoke";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useState } from "react";
import { RoomListItem, RoomListLabel } from "./RoomListLayout";
import { AddTiny } from "components/Icons";

export const MemberRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let members = useIndex.aev("member/name");
  let { memberEntity, authorized } = useMutations();
  let [inviteOpen, setInviteOpen] = useState(false);

  let membersWithColors = members.map((m, index) => {
    index = index % memberColorsText.length;
    return {
      ...m,
      colorText: memberColorsText[index],
      colorBackground: memberColorsBackground[index],
    };
  });

  return (
    <div className="flex flex-col gap-1">
      <RoomListLabel
        label="members"
        helpText={
          <>
            <p>Visit other members' rooms and see what they're up to!</p>
          </>
        }
      />
      <ul className="sidebarMemberRoomList flex flex-col gap-0.5">
        {membersWithColors
          .filter((f) => f.entity !== memberEntity)
          .map((member) => {
            return (
              <RoomListItem
                key={member.id}
                onRoomChange={props.onRoomChange}
                currentRoom={props.currentRoom}
                roomEntity={member.entity}
                setRoomEditOpen={props.setRoomEditOpen}
                memberColorText={member.colorText}
                memberColorBackground={member.colorBackground}
              >
                {member?.value}
              </RoomListItem>
            );
          })}
        {!authorized ? null : (
          <>
            <button
              onClick={() => setInviteOpen(true)}
              className="sidebarAddMember group flex w-full items-center gap-2 rounded-md border border-transparent py-0.5 px-1 text-grey-55 hover:border-accent-blue  hover:text-accent-blue"
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

// named web colors
// export const memberColorsText = [
//   "text-[royalblue]",
//   "text-[crimson]",
//   "text-[darkgoldenrod]",
//   "text-[green]",
//   "text-[purple]",
//   "text-[darkorange]",
//   "text-[teal]",
//   "text-[mediumvioletred]",
//   "text-[slateblue]",
//   "text-[seagreen]",
//   "text-[steelblue]",
//   "text-[rebeccapurple]",
// ];
// export const memberColorsBackground = [
//   "bg-[royalblue]",
//   "bg-[crimson]",
//   "bg-[darkgoldenrod]",
//   "bg-[green]",
//   "bg-[purple]",
//   "bg-[darkorange]",
//   "bg-[teal]",
//   "bg-[mediumvioletred]",
//   "bg-[slateblue]",
//   "bg-[seagreen]",
//   "bg-[steelblue]",
//   "bg-[rebeccapurple]",
// ];

// via https://palettte.app/ - more separated
export const memberColorsText = [
  "text-[#C61E1E]",
  "text-[#017293]",
  "text-[#956E00]",
  "text-[#657E0F]",
  "text-[#B9086F]",
  "text-[#6716DA]",
  "text-[#008071]",
  "text-[#AF5A06]",
  "text-[#B600B6]",
  "text-[#1B8122]",
  "text-[#9200D4]",
  "text-[#0C56BD]",
];
export const memberColorsBackground = [
  "bg-[#C61E1E]",
  "bg-[#017293]",
  "bg-[#956E00]",
  "bg-[#657E0F]",
  "bg-[#B9086F]",
  "bg-[#6716DA]",
  "bg-[#008071]",
  "bg-[#AF5A06]",
  "bg-[#B600B6]",
  "bg-[#1B8122]",
  "bg-[#9200D4]",
  "bg-[#0C56BD]",
];
