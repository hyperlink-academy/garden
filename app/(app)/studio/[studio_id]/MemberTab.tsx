import { spaceAPI, workerAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { Member, MemberAdd } from "components/Icons";
import { Modal } from "components/Modal";
import { useSmoker } from "components/Smoke";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useAuth } from "hooks/useAuth";
import { WORKER_URL } from "src/constants";
import useSWR from "swr";
import { Props } from "./StudioPage";
import { useState } from "react";
import { BaseSmallCard } from "components/CardPreview/SmallCard";
import { Textarea } from "components/Textarea";
import { SpaceData } from "components/SpacesList";
import { DoorImage } from "components/Doors";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStudioData } from "hooks/useStudioData";
import { Divider } from "components/Layout";

export function Members({ data, isAdmin }: Props) {
  let { session } = useAuth();
  let authorized = data.members_in_studios.find(
    (m) => m.member === session.user?.id
  );

  return (
    <div className="flex h-fit max-w-md flex-col gap-4">
      {isAdmin && (
        <InviteModal welcomeMessage={data.welcome_message} id={data.id} />
      )}
      {/* your studio member card */}
      {session.session && authorized && (
        <div className="flex flex-col gap-2">
          <div className="text-sm italic text-grey-55">
            click your bio to edit it!
          </div>

          <MemberCardWithBio
            spaces={data.spaces_in_studios
              .filter(
                (space) =>
                  !space.space_data.archived &&
                  space.space_data.members_in_spaces.find(
                    (member) => member.member === session.user?.id
                  )
              )
              .map((space) => space.space_data)}
            memberName={session.session?.username}
            memberStudio={session.session?.studio}
          />
        </div>
      )}
      {/* divider, only if you + others are studio members */}
      {session.session && authorized && data?.members_in_studios.length > 1 && (
        <div className="py-2">
          <Divider />
        </div>
      )}
      {/* other studio members */}
      <div className="flex flex-col gap-2">
        {data?.members_in_studios
          .filter(
            (member) =>
              member.identity_data?.username !== session.session?.username
          )
          .map((m) =>
            !m.identity_data ? null : (
              <MemberCardWithBio
                spaces={data.spaces_in_studios
                  .filter(
                    (space) =>
                      !space.space_data.archived &&
                      space.space_data.members_in_spaces.find(
                        (member) => member.member === m.member
                      )
                  )
                  .map((space) => space.space_data)}
                key={m.member}
                memberName={m.identity_data?.username || ""}
                memberStudio={m.identity_data.studio}
              />
            )
          )}
      </div>
    </div>
  );
}

const MemberCardWithBio = (props: {
  memberName: string;
  memberStudio: string;
  spaces: SpaceData[];
}) => {
  let { mutate } = useMutations();
  let memberEntity = db.useUniqueAttribute("space/member", props.memberStudio);
  let bio = db.useEntity(memberEntity?.entity || null, "card/content");
  return (
    <MemberCard
      {...props}
      bio={bio?.value || ""}
      onBioChange={(newBio) => {
        if (!memberEntity) return;
        mutate("assertFact", {
          positions: {},
          attribute: "card/content",
          value: newBio,
          entity: memberEntity?.entity,
        });
      }}
    />
  );
};

export const MemberCard = (props: {
  memberName: string;
  bio: string;
  onBioChange: (newBio: string) => void;
  memberStudio: string;
  spaces: SpaceData[];
}) => {
  let params = useParams<{ studio_id: string }>();
  let { session } = useAuth();

  let [expanded, setExpanded] = useState(false);
  let [editing, setEditing] = useState(false);
  props.spaces.sort((a, b) => {
    if (!a.lastUpdated || !b.lastUpdated) return 0;
    return (
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  });

  return (
    <div
      className="memberCardWrapper relative flex h-full hover:cursor-pointer"
      onClick={() => {
        if (!editing) setExpanded(!expanded);
        else return;
      }}
    >
      <div
        className={`memberCard memberCardBorder relative flex h-full grow flex-col items-stretch`}
      >
        <div className="memberCardHeader flex items-end justify-between p-2 pb-0 text-white">
          <div className="flex h-fit flex-row gap-2 font-bold">
            <Member />{" "}
            <Link
              className="hover:underline"
              href={`/s/${props.memberName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.memberName}
            </Link>
          </div>
          <div className="text-sm">member</div>
        </div>
        <div className="grow p-1 pt-1">
          <div
            className={`studioMemberContent mt-0 flex h-full flex-col items-start gap-2 overflow-hidden rounded-md bg-white p-2 text-sm text-grey-35 ${
              !expanded && "max-h-[200px]"
            }`}
          >
            <button
              className={`flex h-full min-h-0 w-full grow items-start overflow-hidden text-left ${
                session.session?.studio === props.memberStudio
                  ? "hover:cursor-text"
                  : ""
              }`}
              onClick={() => {
                if (session.session?.studio === props.memberStudio)
                  setEditing(true);
                return;
              }}
            >
              {editing ? (
                <Textarea
                  spellCheck={false}
                  className="h-full w-full italic"
                  placeholder={
                    session.session?.studio !== props.memberStudio
                      ? " "
                      : "introduce yourself…"
                  }
                  value={props.bio}
                  onChange={(e) => {
                    props.onBioChange(e.currentTarget.value);
                  }}
                  onBlur={() => {
                    setEditing(false);
                  }}
                  onFocus={() => setExpanded(true)}
                />
              ) : (
                <Textarea
                  value={props.bio}
                  readOnly
                  placeholder={
                    session.session?.studio !== props.memberStudio
                      ? " "
                      : "introduce yourself…"
                  }
                  className="min-h-0 grow overflow-hidden"
                />
              )}
            </button>
            {props.spaces.length > 0 && (
              <>
                <Divider />
                <div
                  className={`flex shrink-0 gap-1 text-grey-55 ${
                    expanded ? "flex-col" : "justify-between"
                  }`}
                >
                  {expanded ? (
                    props.spaces.map((space) => (
                      <Link
                        href={`/studio/${params?.studio_id}/space/${space.id}`}
                        className="w-fit"
                        key={space.id}
                      >
                        <div className="flex flex-row gap-1 text-sm hover:font-bold hover:text-accent-blue">
                          <DoorImage small {...space} width="16" />
                          {space.display_name}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <>
                      <Link
                        href={`/studio/${params?.studio_id}/space/${props.spaces[0].id}`}
                        className="w-fit"
                      >
                        <div className="flex flex-row gap-1 text-sm hover:font-bold hover:text-accent-blue">
                          <DoorImage small {...props.spaces[0]} width="16" />
                          {props.spaces[0].display_name}
                        </div>
                      </Link>
                      {props.spaces.length > 1 && (
                        <div>+{props.spaces.length - 1}</div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function InviteModal(props: { welcomeMessage: string; id: string }) {
  let [welcomeMessage, setWelcomeMessage] = useState(props.welcomeMessage);
  let { mutate } = useStudioData(props.id);
  let [open, setOpen] = useState(false);
  const spaceID = useSpaceID();
  let { authToken } = useAuth();
  let { data: inviteLink } = useSWR(
    `${WORKER_URL}/space/${spaceID}/get_share_code`,
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

  let smoker = useSmoker();
  const getShareLink = async (e: React.MouseEvent) => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    smoker({ position: { x: e.clientX, y: e.clientY }, text: "copied!" });
  };

  return (
    <>
      <div className="lightBorder m-auto flex w-full max-w-2xl flex-row items-center justify-between bg-bg-blue p-2 text-grey-55">
        Add a new member!{" "}
        <ButtonPrimary
          icon={<MemberAdd />}
          content="Invite"
          onClick={() => setOpen(true)}
        />
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        header="Invite Studio Members!"
      >
        <div className="flex flex-col gap-4">
          <p>
            Members can add Spaces to the Studio, and chat / comment in each
            other&apos;s Spaces.
          </p>

          <p>
            They won&apos;t be able to otherwise edit Spaces unless explicitly
            invited.
          </p>
          <div className="flex flex-col gap-3 rounded-md border border-grey-80 bg-bg-blue p-2">
            <h4>Send this invite link</h4>
            <div className="inviteMemberModalLink flex w-full gap-2">
              <input
                className="grow bg-grey-90 text-grey-35"
                readOnly
                value={inviteLink}
                onClick={getShareLink}
              />
              <ButtonPrimary
                onClick={(e) => getShareLink(e)}
                content={"Copy"}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h4>Customize your welcome message</h4>
            <p>
              Prospective Studio members will see this on the invite page just
              before joining!
            </p>
            <p className="text-sm italic">
              You can include links & Markdown for styling ✨
            </p>
            <div className="flex flex-col gap-2">
              <Textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.currentTarget.value)}
                className="w-full rounded-md border border-grey-55 p-2"
                placeholder="Add a welcome message…"
              />
              <ButtonPrimary
                disabled={props.welcomeMessage === welcomeMessage}
                content="Save"
                className="justify-self-end"
                onClick={async () => {
                  if (!authToken) return;
                  mutate((s) => {
                    if (!s) return;
                    return { ...s, welcome_message: welcomeMessage };
                  }, false);
                  await workerAPI(WORKER_URL, "update_studio_data", {
                    authToken,
                    studio_id: props.id,
                    data: {
                      welcome_message: welcomeMessage,
                    },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
