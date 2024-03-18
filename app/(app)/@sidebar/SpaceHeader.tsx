"use client";
import { CloseLinedTiny, Settings, Switch } from "components/Icons";
import { HelpButton, SpaceRoleBadge } from "components/Space";
import { SmallSpaceCard, SpaceData } from "components/SpacesList";
import { Truncate } from "components/Truncate";
import { useAuth } from "hooks/useAuth";
import { useIdentityData } from "hooks/useIdentityData";
import { useMutations, useSpaceID } from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";
import { useParams, useRouter } from "next/dist/client/components/navigation";
import Link from "next/link";
import { useState } from "react";
import { base62ToUuid, uuidToBase62 } from "src/uuidHelpers";
import SidebarLayout from "./SidebarLayout";
import { useSidebarState } from "./SidebarState";
import { EditSpaceModal } from "components/CreateSpace";
import * as Popover from "@radix-ui/react-popover";
import { Modal, ModalSubmitButton } from "components/Modal";
import { DotLoader } from "components/DotLoader";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";

export function SpaceHeader(props: {
  children: React.ReactNode;
  context: { type: "user"; username: string } | { type: "studio"; id: string };
  spaces: SpaceData[];
  path: Array<{ name: string; link: string }>;
}) {
  let [switcher, setSwitcher] = useState(false);
  let { session } = useAuth();
  let params = useParams();
  let { data: userSpaces } = useIdentityData(session.session?.username);
  let activeSpace = props.spaces.find((s) =>
    props.context.type === "user"
      ? s.id === base62ToUuid(params?.space as string)
      : s.id === params?.space_id
  );
  let isUserSpace = false;
  if (
    session.user &&
    activeSpace?.members_in_spaces.find((s) => s.member === session.user?.id) &&
    props.context.type === "user"
  )
    isUserSpace = true;
  let spaces = isUserSpace
    ? userSpaces?.members_in_spaces.map((m) => m.space_data as SpaceData)
    : props.spaces;

  let { open } = useSidebarState();

  return (
    <SidebarLayout
      breadcrumb={
        <div className="sidebarBreadcrumb flex shrink-0 flex-row items-center text-sm text-grey-55">
          <div className="sidebarBreadcrumbHome flex shrink-0 flex-row items-center gap-1 text-sm text-grey-55">
            <Link
              href={session.session ? `/s/${session.session.username}` : "/"}
              className="flex gap-1"
            >
              <div className="font-bold hover:text-accent-blue">h</div>
              <div className="font-bold">/</div>
            </Link>
            {isUserSpace === false &&
              props.path.map((p, index) => (
                <Link href={p.link} key={index}>
                  <div className="SidebarBreadcrumbStudio flex gap-1">
                    <div className="min-w-0 max-w-[16ch] hover:text-accent-blue">
                      <Truncate className="w-full max-w-none overflow-hidden bg-white">
                        {p.name}
                      </Truncate>
                    </div>
                    <div>/</div>
                  </div>
                </Link>
              ))}
          </div>
          <button
            className="ml-0.5 h-fit rounded-[2px] px-0.5 pb-[1px] hover:bg-accent-blue hover:text-white"
            onClick={() => setSwitcher(!switcher)}
          >
            {!switcher ? <Switch /> : <CloseLinedTiny />}
          </button>
        </div>
      }
      header={
        <div className="flex flex-col">
          <div className="sidebarSpaceName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
            {activeSpace?.display_name}
          </div>
          <div className="flex items-center justify-between px-3 pt-3">
            <div className="sidebarRolebadgeWrapper shrink-0">
              {activeSpace && <SpaceRoleBadge space_id={activeSpace.id} />}
            </div>
            <div className="flex gap-1">
              <HelpButton />
              {activeSpace && <SpaceSettings space_id={activeSpace.id} />}
            </div>
          </div>
        </div>
      }
    >
      <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch">
        {open ? null : (
          <div
            className="sidebarSpaceName mx-auto h-fit w-fit shrink-0 rotate-180 flex-row font-bold "
            style={{ writingMode: "vertical-lr" }}
          >
            {activeSpace?.display_name}
          </div>
        )}
        <div className="sidebarContent grow">
          {switcher && open ? (
            <div className="pl-2 pr-3 flex flex-col gap-3">
              {spaces
                ?.filter((s) => !s.archived)
                .map((space) => (
                  <Link
                    key={space.id}
                    href={
                      props.context.type === "studio"
                        ? `/studio/${uuidToBase62(props.context.id)}/space/${
                            space.id
                          }`
                        : `/s/${space.owner.username}/s/${uuidToBase62(
                            space.id
                          )}/${space.display_name}`
                    }
                  >
                    <SmallSpaceCard {...space} />
                  </Link>
                ))}{" "}
            </div>
          ) : (
            props.children
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

const SpaceSettings = (props: { space_id: string }) => {
  let spaceID = useSpaceID();
  let { authorized } = useMutations();
  let { data } = useSpaceData(props);
  let router = useRouter();
  let { session } = useAuth();

  let isOwner =
    session.session && session.session.username === data?.owner.username;
  let [editModal, setEditModal] = useState(false);

  return (
    <>
      {!authorized ? null : isOwner ? (
        <button
          className={`text-grey-55 hover:text-accent-blue`}
          onClick={() => {
            setEditModal(true);
          }}
        >
          <Settings />
        </button>
      ) : (
        <MemberOptions />
      )}

      <EditSpaceModal
        space_id={props.space_id}
        open={editModal}
        onDelete={() => {
          if (!session.session) return;
          router.push(`/s/${session.session.username}`);
        }}
        onClose={() => setEditModal(false)}
        spaceID={spaceID}
      />
    </>
  );
};

const MemberOptions = () => {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  let { authToken, session } = useAuth();
  let spaceID = useSpaceID();
  let router = useRouter();
  let [loading, setLoading] = useState(false);

  return (
    <>
      <Popover.Root>
        <Popover.Trigger className="hover:text-accent-blue text-grey-55">
          <Settings />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="border-grey-80 z-50 flex max-w-xs flex-col gap-2 rounded-md border bg-white py-2 drop-shadow-md"
            sideOffset={4}
          >
            <button
              className="text-accent-red hover:bg-bg-blue px-2 font-bold"
              onClick={() => setLeaveModalOpen(true)}
            >
              Leave space
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <Modal
        header="Are You Sure?"
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
      >
        You&apos;ll no longer be able to edit this Space, and it will be removed
        from your homepage.
        <ModalSubmitButton
          destructive
          content={loading ? "" : "Leave Space"}
          icon={loading ? <DotLoader /> : undefined}
          onClose={() => setLeaveModalOpen(false)}
          onSubmit={async () => {
            if (!spaceID || !authToken || !session) return;
            setLoading(true);
            await workerAPI(WORKER_URL, "leave_space", {
              authToken,
              type: "space",
              do_id: spaceID,
            });
            router.push("/s/" + session.session?.username);
            setLoading(false);
          }}
        />
      </Modal>
    </>
  );
};
