import { spaceAPI } from "backend/lib/api";
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

export function Members({ data, isAdmin }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {isAdmin && <InviteModal />}

      <div className="flex flex-col gap-2">
        {data?.members_in_studios.map((m) =>
          !m.identity_data ? null : (
            <Memberc
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

const Memberc = (props: {
  memberName: string;
  memberStudio: string;
  spaces: SpaceData[];
}) => {
  let memberEntity = db.useUniqueAttribute("space/member", props.memberStudio);
  let bio = db.useEntity(memberEntity?.entity || null, "card/content");

  let params = useParams<{ studio_id: string }>();
  let { mutate } = useMutations();
  let { session } = useAuth();
  return (
    <div className="relative">
      <div className={`memberCardBorder relative grow`}>
        <div className="flex justify-between p-2 text-white">
          <div className="flex flex-row gap-2 font-bold ">
            <Member /> {props.memberName}
          </div>
          <div className="text-cs font-normal">member</div>
        </div>
        <div className="p-2">
          <div className="flex h-full flex-col gap-2 rounded-lg bg-white p-2">
            <Textarea
              previewOnly={session.session?.studio !== props.memberStudio}
              spellCheck={false}
              className="h-full"
              placeholder={
                session.session?.studio !== props.memberStudio
                  ? " "
                  : "write a bio..."
              }
              value={bio?.value}
              onChange={(e) => {
                if (!memberEntity) return;
                mutate("assertFact", {
                  positions: {},
                  attribute: "card/content",
                  value: e.currentTarget.value,
                  entity: memberEntity?.entity,
                });
              }}
            />
            <div>
              <h4 className="font-bold text-grey-55">
                Spaces ({props.spaces.length})
              </h4>
              {props.spaces.map((space) => (
                <Link href={`/studio/${params?.studio_id}/space/${space.id}`}>
                  <div className="flex flex-row gap-2 text-sm hover:text-accent-blue">
                    <DoorImage small {...space} width="18" />
                    {space.display_name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function InviteModal() {
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
            Studio members can add spaces to the studio, and see and
            comment/chat in each others’ spaces!
          </p>

          <p>
            However they won’t be able to change or delete spaces that they are
            not explicitly invited to.
          </p>
          <div className="flex flex-col gap-3 rounded-md border border-grey-80 bg-bg-blue p-2">
            <h4>Send this Invite Link</h4>
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
        </div>
      </Modal>
    </>
  );
}
