import {
  useDaily,
  useLocalParticipant,
  useMeetingState,
  useParticipant,
  useParticipantIds,
  useParticipantProperty,
} from "@daily-co/daily-react";
import {
  AddTiny,
  CallMutedTiny,
  CallSmall,
  CallUnMutedTiny,
  DisclosureCollapseTiny,
  DisclosureExpandTiny,
  MoreOptionsSmall,
  RoomMember,
} from "components/Icons";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import tailwind from "tailwind.config";
import { useState } from "react";
import { useOpenCard } from "hooks/useUIState";
import { Fact } from "data/Facts";
import { MediaDeviceSettings } from "components/Calls/CallManager";
import { useJoinCall } from "components/Calls/CallProvider";
import { DotLoader } from "components/DotLoader";
import { useAuth } from "hooks/useAuth";
import { useSmoker } from "components/Smoke";
import useSWR from "swr";
import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { Divider } from "components/Layout";
import { Modal } from "components/Modal";

export const People = () => {
  let members = db.useAttribute("member/name");
  let membersInCall = db.useAttribute("presence/in-call");
  let callOngoing = membersInCall.length > 0;

  let activeSessions = db
    .useAttribute("presence/client-member")
    .map((m) => m.value.value);
  let uniqueSessions = new Set(activeSessions);
  let [expanded, setExpanded] = useState(false);

  let onlineMembers = members.filter((f) => uniqueSessions.has(f.entity));
  let offline = members.filter((f) => !uniqueSessions.has(f.entity));

  let meetingState = useMeetingState();
  let inCall = meetingState === "joined-meeting";

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-row items-center justify-between text-grey-55">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex h-[28px] items-center gap-1 text-sm font-bold text-grey-55  hover:text-accent-blue
           `}
        >
          {expanded ? <DisclosureExpandTiny /> : <DisclosureCollapseTiny />}

          {uniqueSessions.size > 1
            ? `${uniqueSessions.size}/${members.length} online`
            : `${members.length} members`}
        </button>
        {!callOngoing && <JoinCall />}
      </div>
      {callOngoing ? (
        <div
          className={`flex flex-col gap-2 rounded-md border ${
            inCall ? "border-accent-blue" : "border-grey-80"
          }  p-2`}
        >
          <div className="-mx-1 -mb-0.5 -mt-2 flex flex-col gap-[6px]">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`-mx-1 flex justify-between rounded-t-md border border-l-0 border-r-0 border-t-0 bg-bg-blue px-2 py-1 text-xs font-bold text-accent-blue ${
                inCall ? "border-b-accent-blue" : "border-b-grey-80"
              } `}
            >
              <div>call ongoing</div>
              <div className="flex items-center gap-0.5">
                {membersInCall.length} <RoomMember />
              </div>
            </button>
            {inCall ? <CallSettings /> : <JoinCall />}
          </div>
          {expanded && (
            <div className="flex flex-col gap-2 pt-1">
              <MembersInCall membersLength={members.length} />
              <MembersList
                onlineMembers={onlineMembers}
                offlineMembers={offline}
              />
            </div>
          )}
        </div>
      ) : expanded ? (
        <div className="flex flex-col gap-2 rounded-md border border-grey-80 p-2">
          <MembersList onlineMembers={onlineMembers} offlineMembers={offline} />
        </div>
      ) : null}
    </div>
  );
};

const JoinCall = () => {
  let { authorized } = useMutations();
  let [loading, setLoading] = useState(false);
  let joinCall = useJoinCall();

  let membersInCall = db.useAttribute("presence/in-call");
  let callOngoing = membersInCall.length > 0;

  let meetingState = useMeetingState();
  let inCall = meetingState === "joined-meeting";
  return (
    <>
      {authorized &&
        (callOngoing ? (
          <ButtonSecondary
            onClick={async (e) => {
              e.preventDefault();
              if (loading || inCall) return;
              setLoading(true);
              await joinCall();
              setLoading(false);
            }}
            content={loading ? <DotLoader /> : "Join Call!"}
            icon={<CallSmall />}
            className={`${callOngoing ? "!w-full grow " : ""}`}
          />
        ) : (
          <button
            className="rounded-md   hover:text-accent-blue"
            onClick={async (e) => {
              e.preventDefault();
              if (loading || inCall) return;
              setLoading(true);
              await joinCall();
              setLoading(false);
            }}
          >
            {loading ? (
              <div className="-mt-1 h-[28px] ">
                <DotLoader />{" "}
              </div>
            ) : (
              <CallSmall />
            )}
          </button>
        ))}
    </>
  );
};

const CallSettings = () => {
  let [settingsOpen, setSettingsOpen] = useState(false);

  let localPariticpant = useLocalParticipant();
  let muted = localPariticpant?.tracks.audio.state !== "playable";
  let meetingState = useMeetingState();

  let inCall = meetingState === "joined-meeting";
  let call = useDaily();
  return (
    <div>
      <div className="flex flex-row justify-between gap-1">
        <div className="flex w-full flex-row gap-1">
          <button
            onClick={() => call?.setLocalAudio(muted)}
            className={`${
              muted
                ? "border-grey-55 bg-grey-55 hover:bg-white"
                : " border-accent-blue bg-accent-blue text-white"
            } grow rounded-md border px-2 py-1 text-sm font-bold`}
          >
            {muted ? "speak" : "mute"}
          </button>

          <button
            className="shrink-0 rounded-md border px-2 py-1 text-sm font-bold hover:border-accent-red hover:text-accent-red"
            onClick={(e) => {
              e.preventDefault();
              if (inCall) return call?.leave();
            }}
          >
            leave
          </button>
        </div>
        <button
          className="flex w-6 items-center justify-center"
          onClick={() => setSettingsOpen((s) => !s)}
        >
          <MoreOptionsSmall />
        </button>
      </div>
      {settingsOpen && (
        <MediaDeviceSettings onSelect={() => setSettingsOpen(false)} />
      )}
    </div>
  );
};

const MembersList = ({
  onlineMembers,
  offlineMembers,
}: {
  onlineMembers: Fact<"member/name">[];
  offlineMembers: Fact<"member/name">[];
}) => {
  let [offlineExpanded, setOfflineExpanded] = useState(false);
  let length = offlineMembers.length + onlineMembers.length;

  let membersInCall = db.useAttribute("presence/in-call");
  let callOngoing = membersInCall.length > 0;

  let { authorized } = useMutations();

  return (
    <>
      {onlineMembers.length > 0 && (
        <div className="memberList flex flex-col gap-2">
          {onlineMembers.map((m) => (
            <Member entityID={m.entity} key={m.id} />
          ))}
        </div>
      )}
      {length <= 4 && (
        <div className="memberList flex flex-col gap-2">
          {offlineMembers.map((m) => (
            <Member entityID={m.entity} key={m.id} />
          ))}
        </div>
      )}
      {offlineMembers.length > 0 && length > 4 && (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setOfflineExpanded(!offlineExpanded)}
            className="flex flex-row items-center gap-1 text-sm font-bold text-grey-55"
          >
            {offlineExpanded ? (
              <DisclosureExpandTiny />
            ) : (
              <DisclosureCollapseTiny />
            )}
            {offlineMembers.length} offline
          </button>

          {offlineExpanded && (
            <div className="pl-4">
              <div>
                {offlineMembers.map((m) => (
                  <Member entityID={m.entity} key={m.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {authorized && (
        <>
          <Divider />
          <InviteMember />
        </>
      )}
    </>
  );
};

const MembersInCall = (props: { membersLength: number }) => {
  let participantIDs = useParticipantIds();
  return (
    <>
      {participantIDs.map((id) => (
        <MemberInCall participantID={id} key={id} />
      ))}
      {participantIDs.length !== props.membersLength && (
        <hr className="-mx-2 border-grey-80" />
      )}
    </>
  );
};

const MemberInCall = (props: { participantID: string }) => {
  let username = useParticipantProperty(props.participantID, "user_name");
  let memberEntity = db.useUniqueAttribute("member/name", username);
  if (!memberEntity) return null;
  return <Member entityID={memberEntity.entity} showInCall />;
};

const Member = (props: { entityID: string; showInCall?: boolean }) => {
  let { memberEntity } = useMutations();
  let activeSessions =
    db.useReference(props.entityID, "presence/client-member") || [];
  let color = db.useEntity(props.entityID, "member/color");
  let name = db.useEntity(props.entityID, "member/name");
  let participant = useParticipantInCall(name?.value);
  let onCard = db.useEntity(
    activeSessions[0]?.entity || null,
    "presence/on-card"
  );
  let open = useOpenCard();
  let cardTitle = db.useEntity(onCard?.value.value || null, "card/title");
  if (participant && !props.showInCall) return null;

  return (
    <div>
      <div
        className="flex w-full flex-row items-start gap-1 overflow-hidden"
        style={{
          color:
            activeSessions.length > 0
              ? color?.value
              : tailwind.theme.colors["grey-55"],
        }}
      >
        <div className="mt-0.5 ">
          {!participant ? (
            <RoomMember />
          ) : participant.tracks.audio.state === "playable" ? (
            <CallUnMutedTiny />
          ) : (
            <div className="text-grey-55">
              <CallMutedTiny />
            </div>
          )}
        </div>
        <div>
          <div
            className={`break-all text-sm ${
              activeSessions.length > 0 ? "font-bold" : ""
            }`}
          >
            {memberEntity === props.entityID ? "You" : name?.value}
          </div>
          {cardTitle && memberEntity !== props.entityID && (
            <div className="max-w-full truncate whitespace-nowrap text-xs italic text-grey-55">
              in{" "}
              <span
                role="button"
                className="underline hover:cursor-pointer"
                onClick={() => {
                  if (onCard) open(onCard.value.value);
                }}
              >
                {cardTitle?.value || "Untitled Card"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function useParticipantInCall(username?: string) {
  let id = useParticipantIds({
    filter: (participant) => participant.user_name === username,
  });
  return useParticipant(id[0]);
}

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const InviteMember = () => {
  let { authToken, session } = useAuth();
  let [open, setInviteOpen] = useState(false);
  let isMember = db.useUniqueAttribute("space/member", session.session?.studio);
  let membersInCall = db.useAttribute("presence/in-call");
  let callOngoing = membersInCall.length > 0;
  let { authorized } = useMutations();

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
        return `${document.location.protocol}//${document.location.host}${document.location.pathname}/join?code=${code.code}`;
      }
    }
  );

  const getShareLink = async (e: React.MouseEvent) => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    smoker({ position: { x: e.clientX, y: e.clientY }, text: "copied!" });
  };

  return (
    <>
      {authorized && (
        // (callOngoing ? (
        <button
          className=" flex items-center gap-1 text-sm italic text-grey-55"
          onClick={() => setInviteOpen(true)}
        >
          <AddTiny /> invite
        </button>
      )}
      <Modal open={open} onClose={() => setInviteOpen(false)}>
        <div className="inviteMemberModal flex flex-col place-items-center gap-4 p-4 text-center">
          <div className="flex flex-col gap-2">
            <h3>Send a friend this invite link!</h3>
            <p>
              They can use it to become a space member. <br /> Members can
              create and edit cards. Members have full access to the space and
              can invite other members.
            </p>
          </div>
          <div className="inviteMemberModalLink flex w-full gap-2">
            <input
              className="grow bg-grey-90 text-grey-35"
              readOnly
              value={inviteLink}
              onClick={getShareLink}
            />
            <ButtonPrimary onClick={(e) => getShareLink(e)} content={"Copy"} />
          </div>
        </div>
      </Modal>
    </>
  );
};
