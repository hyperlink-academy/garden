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
  MemberAdd,
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
import { ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { Modal } from "components/Modal";
import { Truncate } from "components/Truncate";
import { useSpaceData } from "hooks/useSpaceData";

export const People = () => {
  let members = db.useAttribute("member/name");
  let membersInCall = db.useAttribute("presence/in-call");
  let callOngoing = membersInCall.length > 0;

  let activeSessions = db
    .useAttribute("presence/client-member")
    .map((m) => m.value.value);
  let uniqueSessions = new Set(activeSessions);
  let { authorized } = useMutations();
  let [onlineExpanded, setOnlineExpanded] = useState(true);
  let [offlineExpanded, setOfflineExpanded] = useState(false);
  let [callExpanded, setCallExpanded] = useState(true);

  let onlineMembers = members.filter((f) => uniqueSessions.has(f.entity));
  let offlineMembers = members.filter((f) => !uniqueSessions.has(f.entity));

  return (
    <div className="peopleList no-scrollbar flex h-fit flex-col overflow-y-scroll border-t border-grey-80 px-3 pb-2 text-sm">
      <div className="peopleOnline  mt-1 flex  flex-col ">
        <button
          onClick={() => {
            if (onlineExpanded) {
              setOnlineExpanded(false);
              setCallExpanded(false);
            }
            if (!onlineExpanded) {
              setOnlineExpanded(true);
              setCallExpanded(true);
            }
          }}
          className={` h-[28px]  gap-1 text-left text-sm  font-bold text-grey-35  hover:text-accent-blue`}
        >
          Online {onlineExpanded === false && `(${onlineMembers.length})`}
        </button>

        {callOngoing ? (
          <CallPanel
            callExpanded={callExpanded}
            toggleCallExpanded={() => setCallExpanded(!callExpanded)}
          />
        ) : null}
        {onlineExpanded ? (
          <MembersOnline onlineMembers={onlineMembers} />
        ) : null}
      </div>
      {offlineMembers.length === 0 ? null : (
        <>
          <div className="peopleOffline flex  flex-col ">
            <button
              onClick={() => setOfflineExpanded(!offlineExpanded)}
              className={`h-[28px]  gap-1 text-left text-sm font-bold  text-grey-55  hover:text-accent-blue`}
            >
              Offline{" "}
              {offlineExpanded === false && `(${offlineMembers.length})`}
            </button>

            {offlineExpanded ? (
              <MembersOffline offlineMembers={offlineMembers} />
            ) : null}
          </div>
        </>
      )}
      {authorized && (
        <div className="mb-2">
          <InviteMember />
        </div>
      )}
      {!callOngoing && <JoinCall />}
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
          <ButtonPrimary
            onClick={async (e) => {
              e.preventDefault();
              if (loading || inCall) return;
              setLoading(true);
              await joinCall();
              setLoading(false);
            }}
            content={loading ? <DotLoader /> : "Join Call!"}
            icon={<CallSmall />}
            className={` !w-full grow `}
          />
        ) : (
          <ButtonTertiary
            className={` !w-full grow `}
            onClick={async (e) => {
              e.preventDefault();
              if (loading || inCall) return;
              setLoading(true);
              await joinCall();
              setLoading(false);
            }}
            content={
              loading ? (
                <div className="-mt-1 flex h-[28px] items-center">
                  <DotLoader />
                </div>
              ) : (
                "Start Call"
              )
            }
            icon={loading ? <></> : <CallSmall />}
          />
        ))}
    </>
  );
};

const CallPanel = (props: {
  callExpanded: boolean;
  toggleCallExpanded: () => void;
}) => {
  let meetingState = useMeetingState();
  let members = db.useAttribute("member/name");
  let membersInCall = db.useAttribute("presence/in-call");

  let localPariticpant = useLocalParticipant();
  let muted = localPariticpant?.tracks.audio.state !== "playable";

  let activeSessions = db
    .useAttribute("presence/client-member")
    .map((m) => m.value.value);

  let inCall = meetingState === "joined-meeting";
  return (
    <>
      <div className="peopleCallPanel mb-2">
        <div
          className={`peopleCallPanelHeader flex w-full flex-col gap-1 rounded-t-md border p-2 pt-0 text-left text-xs font-bold ${
            !inCall
              ? "border-accent-blue bg-bg-blue text-accent-blue"
              : muted
              ? "border-grey-55 bg-grey-55 text-white"
              : "border-accent-blue bg-accent-blue text-white"
          } ${props.callExpanded && inCall ? "" : "rounded-b-md"}`}
        >
          <button
            className="w-full pt-2 text-left"
            onClick={() => props.toggleCallExpanded()}
          >
            {inCall ? "in call…" : "call ongoing…"}
          </button>
          {inCall ? <CallSettings /> : <JoinCall />}
        </div>
        {props.callExpanded && inCall && (
          <div
            className={`peopleCallPanelMembers -mt-[1px]  rounded-b-md border px-2 pb-2 pt-1 ${
              !inCall
                ? "border-accent-blue"
                : muted
                ? "border-grey-55 "
                : "border border-accent-blue"
            }`}
          >
            <div className="flex flex-col gap-2 pt-1">
              <MembersInCall membersLength={members.length} />
            </div>
          </div>
        )}
      </div>
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
    <>
      <div className="flex w-full justify-between gap-1 selection:flex-row">
        <div className="flex w-full flex-row gap-2">
          <button
            onClick={(e) => {
              call?.setLocalAudio(muted);
            }}
            className={`
             grow rounded-md border border-white bg-white px-2 py-0 text-sm font-bold ${
               muted ? "text-grey-55 " : "text-accent-blue"
             }`}
          >
            {muted ? "unmute" : "mute"}
          </button>
          <button
            className="shrink-0 rounded-md border border-white px-2 py-0 text-sm font-bold hover:border-accent-red hover:text-accent-red"
            onClick={(e) => {
              e.preventDefault();
              if (inCall) return call?.leave();
            }}
          >
            leave
          </button>
        </div>
        <button
          className="flex w-4 items-center justify-center"
          onClick={() => setSettingsOpen((s) => !s)}
        >
          <MoreOptionsSmall />
        </button>
      </div>
      {settingsOpen && (
        <MediaDeviceSettings onSelect={() => setSettingsOpen(false)} />
      )}
    </>
  );
};

const MembersOnline = ({
  onlineMembers,
}: {
  onlineMembers: Fact<"member/name">[];
}) => {
  return (
    <>
      {onlineMembers.length > 0 && (
        <div className="peopleOnlineList mb-2 flex flex-col gap-2">
          {onlineMembers.map((m) => (
            <Member entityID={m.entity} key={m.id} />
          ))}
        </div>
      )}
    </>
  );
};

const MembersOffline = ({
  offlineMembers,
}: {
  offlineMembers: Fact<"member/name">[];
}) => {
  return (
    <>
      {offlineMembers.length > 0 && (
        <div className="peopleOfflineList mb-2 flex flex-col gap-2">
          {offlineMembers.map((m) => (
            <Member entityID={m.entity} key={m.id} />
          ))}
        </div>
      )}
    </>
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
    <div
      className="flex w-full flex-row items-start gap-1 overflow-hidden bg-white"
      style={{
        color:
          activeSessions.length > 0
            ? color?.value
            : tailwind.theme.colors["grey-55"],
      }}
    >
      <div className="mt-0.5 shrink-0 ">
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
      <div className="w-full min-w-0 grow bg-inherit">
        <div
          className={`break-all text-sm ${
            activeSessions.length > 0 ? "font-bold" : ""
          }`}
        >
          {memberEntity === props.entityID ? "You" : name?.value}
        </div>
        {cardTitle && memberEntity !== props.entityID && (
          <div className="flex w-full min-w-0  gap-[5px] overflow-hidden bg-inherit text-xs italic text-grey-55">
            in{" "}
            <Truncate className="w-full min-w-0 grow overflow-hidden bg-inherit ">
              <div
                role="button"
                className="over:cursor-pointer whitespace-nowrap underline"
                onClick={() => {
                  if (onCard) open(onCard.value.value);
                }}
              >
                {cardTitle?.value || "Untitled Card"}
              </div>
            </Truncate>
          </div>
        )}
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
  let { authorized } = useMutations();
  let smoker = useSmoker();
  const spaceID = useSpaceID();
  let { data } = useSpaceData(spaceID);
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
        return `${document.location.protocol}//${document.location.host}/s/${data?.owner.username}/s/${data?.name}/${data?.display_name}/join?code=${code.code}`;
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
          className="flex items-center gap-2 text-sm italic text-grey-55"
          onClick={() => setInviteOpen(true)}
        >
          <AddTiny className="text-grey-80" /> invite
        </button>
      )}
      <Modal
        open={open}
        header="Send a friend this invite link…"
        onClose={() => setInviteOpen(false)}
      >
        <div className="inviteMemberModal flex flex-col  gap-2 p-0 ">
          <div className="flex flex-col gap-2">
            <p>So they can join as a member of this Space!</p>
            <p>
              Members have full access — they can create and edit cards, and
              invite other members.
            </p>
          </div>
          <div className="inviteMemberModalLink flex w-full gap-2 pt-4">
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
