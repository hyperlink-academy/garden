import { MoreOptionsSmall } from "components/Icons";
import * as Popover from "@radix-ui/react-popover";
import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { Modal } from "components/Layout";
import { StudioForm } from "components/CreateStudio";
import { ButtonLink, ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { useAuth } from "hooks/useAuth";
import useSWR from "swr";
import { spaceAPI } from "backend/lib/api";
import { useSmoker } from "components/Smoke";
import Router from "next/router";

export function StudioOptionsMenu(props: { id: string }) {
  let [open, setOpen] = useState(false);
  let [inviteModalOpen, setInviteModalOpen] = useState(false);
  let [studioSettingsModalOpen, setStudioSettingsModalOpen] = useState(false);
  return (
    <>
      <Popover.Root open={open} onOpenChange={(o) => setOpen(o)}>
        <Popover.Trigger>
          <MoreOptionsSmall />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="w-56 rounded-md border-2 border-grey-80 bg-white p-2 drop-shadow-md"
            sideOffset={8}
          >
            <button
              className="w-full py-1 px-2 text-right text-grey-35 hover:bg-bg-blue"
              onClick={() => {
                setInviteModalOpen(true);
                setOpen(false);
              }}
            >
              Invite members
            </button>
            <button
              className="w-full py-1 px-2 text-right text-grey-35 hover:bg-bg-blue"
              onClick={() => setStudioSettingsModalOpen(true)}
            >
              Studio Settings
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <InviteModal
        id={props.id}
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      <StudioSettings
        id={props.id}
        open={studioSettingsModalOpen}
        onClose={() => setStudioSettingsModalOpen(false)}
      />
    </>
  );
}

function StudioSettings(props: {
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  let { session, authToken } = useAuth();
  let { data, mutate } = useStudioData(props.id);
  let [loading, setLoading] = useState(false);
  let [formState, setFormState] = useState({
    name: "",
    description: "",
  });
  let supabase = useSupabaseClient<Database>();
  useEffect(() => {
    setFormState({
      description: data?.description || "",
      name: data?.name || "",
    });
  }, [data?.description, data?.name]);
  return (
    <>
      <Modal open={props.open} onClose={props.onClose}>
        <form
          className="flex flex-col gap-8"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            mutate((s) => {
              if (!s) return;
              return { ...s, ...formState };
            }, false);

            await supabase
              .from("studios")
              .update({
                description: formState.description,
                name: formState.name,
              })
              .eq("id", props.id);
            setLoading(false);
            mutate();
          }}
        >
          <StudioForm setFormState={setFormState} formState={formState} />

          <div className="flex flex-row justify-end gap-4">
            <ButtonLink
              content="nevermind"
              className="font-normal"
              onClick={props.onClose}
            />
            <ButtonPrimary
              disabled={!formState.name}
              content={loading ? <DotLoader /> : "Update Studio"}
            />
          </div>
          {data?.creator === session?.user?.id ? (
            <>
              <hr className="border-grey-80" />
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center justify-between gap-4">
                  <h3>Delete Studio</h3>
                  <ButtonPrimary
                    destructive
                    content="Delete Studio"
                    onClick={async () => {
                      if (!data || !authToken) return;
                      console.log(
                        await spaceAPI(
                          `${WORKER_URL}/space/${data.do_id}`,
                          "delete_self",
                          { authToken }
                        )
                      );
                      Router.push(`/`);
                    }}
                  />
                </div>
                <p className=" text-grey-55">
                  This studio will disappear. Spaces linked here WILL NOT be
                  deleted (they can be found in the Homes of their members).
                  However you will lose any conversations or highlights you have
                  made on the studio level.
                </p>
              </div>
            </>
          ) : null}
        </form>
      </Modal>
    </>
  );
}

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
function InviteModal(props: {
  id: string;
  onClose: () => void;
  open: boolean;
}) {
  let { data } = useStudioData(props.id);
  let { authToken } = useAuth();
  let { data: inviteLink } = useSWR(
    !data || !authToken
      ? null
      : `${WORKER_URL}/space/${data.do_id}/get_share_code`,
    async () => {
      if (!data || !authToken) return;
      let code = await spaceAPI(
        `${WORKER_URL}/space/${data.do_id}`,
        "get_share_code",
        { authToken }
      );
      if (code.success) {
        return `${document.location.href}/join?code=${code.code}`;
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
      <Modal open={props.open} onClose={props.onClose}>
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
        {data?.members_in_studios.map((m) => m.identity_data?.username)}
      </Modal>
    </>
  );
}
