import {
  useDaily,
  useLocalParticipant,
  useMeetingState,
  useParticipant,
  useParticipantIds,
  useParticipantProperty,
} from "@daily-co/daily-react";
import {
  CallMutedTiny,
  CallSmall,
  CallUnMutedTiny,
  CloseFilledTiny,
  DisclosureCollapseTiny,
  DisclosureExpandTiny,
  RoomMember,
  SettingsOutline,
} from "components/Icons";
import { db, useMutations } from "hooks/useReplicache";
import tailwind from "tailwind.config";
import { useState } from "react";
import { useOpenCard } from "hooks/useUIState";
import { Fact } from "data/Facts";
import { MediaDeviceSettings } from "components/Calls/CallManager";
import { useJoinCall } from "components/Calls/CallProvider";
import { DotLoader } from "components/DotLoader";

export const People = () => {
  let members = db.useAttribute("member/name");
  let membersInCall = db.useAttribute("presence/in-call");
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center justify-between text-grey-55">
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-bold text-grey-55"
        >
          {membersInCall.length > 0 || inCall
            ? "call ongoing..."
            : uniqueSessions.size > 1
            ? `${uniqueSessions.size}/${members.length} online`
            : `${members.length} members`}
        </button>
        {!inCall ? (
          <JoinCall />
        ) : expanded ? (
          <DisclosureCollapseTiny />
        ) : (
          <DisclosureExpandTiny />
        )}
      </div>
      {inCall ? (
        <div className="flex flex-col gap-2 rounded-md border border-grey-80 p-2">
          <CallSettings />
          {expanded && (
            <>
              <MembersInCall membersLength={members.length} />
              <MembersList
                onlineMembers={onlineMembers}
                offlineMembers={offline}
              />
            </>
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
  let meetingState = useMeetingState();

  let inCall = meetingState === "joined-meeting";
  return (
    <button
      className="hover:text-accent-green"
      onClick={async (e) => {
        e.preventDefault();
        if (loading || inCall) return;
        setLoading(true);
        await joinCall();
        setLoading(false);
      }}
    >
      {!authorized ? null : loading ? <DotLoader /> : <CallSmall />}
    </button>
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
        <button
          onClick={() => call?.setLocalAudio(muted)}
          className={`${
            muted
              ? "border-grey-55 bg-grey-55 hover:bg-white"
              : "border-accent-blue bg-white text-accent-blue"
          } rounded-md border px-2 py-1 text-sm font-bold`}
        >
          {muted ? "speak" : "mute"}
        </button>

        <div className="flex flex-row justify-end gap-1">
          <button
            className="rounded-md border px-2 py-1 text-sm font-bold hover:border-accent-red hover:text-accent-red"
            onClick={(e) => {
              e.preventDefault();
              if (inCall) return call?.leave();
            }}
          >
            leave
          </button>
          <button onClick={() => setSettingsOpen((s) => !s)}>
            <SettingsOutline height={32} width={32} />
          </button>
        </div>
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
  return (
    <>
      <div>
        {onlineMembers.map((m) => (
          <Member entityID={m.entity} key={m.id} />
        ))}
      </div>

      {offlineMembers.length > 0 && (
        <button
          onClick={() => setOfflineExpanded(!offlineExpanded)}
          className="flex flex-row items-center gap-1 font-bold text-grey-55"
        >
          {offlineExpanded ? (
            <DisclosureCollapseTiny />
          ) : (
            <DisclosureExpandTiny />
          )}
          {offlineMembers.length} offline
        </button>
      )}
      {offlineExpanded && (
        <div className="pl-4">
          <div>
            {offlineMembers.map((m) => (
              <Member entityID={m.entity} key={m.id} />
            ))}
          </div>
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
        className="flex flex-row items-center gap-1"
        style={{
          color:
            activeSessions.length > 0
              ? color?.value
              : tailwind.theme.colors["grey-55"],
        }}
      >
        {!participant ? (
          <RoomMember />
        ) : participant.tracks.audio.state === "playable" ? (
          <CallUnMutedTiny />
        ) : (
          <CallMutedTiny />
        )}
        <div
          className={`break-all ${
            activeSessions.length > 0 ? "font-bold" : ""
          }`}
        >
          {memberEntity === props.entityID ? "You" : name?.value}
        </div>
      </div>
      {cardTitle && (
        <div className="text-xs italic text-grey-55">
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
  );
};

function useParticipantInCall(username?: string) {
  let id = useParticipantIds({
    filter: (participant) => participant.user_name === username,
  });
  return useParticipant(id[0]);
}
