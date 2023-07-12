import { MoreOptionsSmall } from "components/Icons";
import * as Popover from "@radix-ui/react-popover";
import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { Modal } from "components/Layout";
import { StudioForm } from "components/CreateStudio";
import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { useAuth } from "hooks/useAuth";
import { spaceAPI, workerAPI } from "backend/lib/api";
import Router from "next/router";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export function StudioOptionsMenu(props: { id: string }) {
  let [open, setOpen] = useState(false);
  let [studioSettingsModalOpen, setStudioSettingsModalOpen] = useState(false);
  return (
    <>
      <Popover.Root open={open} onOpenChange={(o) => setOpen(o)}>
        <Popover.Trigger>
          <MoreOptionsSmall />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-20 flex w-fit flex-col rounded-md border-2 border-grey-80 bg-white p-2 drop-shadow-md"
            sideOffset={8}
          >
            <button
              className="py-1 px-2 text-right text-grey-35 hover:bg-bg-blue"
              onClick={() => setStudioSettingsModalOpen(true)}
            >
              Studio Settings
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

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
            if (!authToken) return;
            setLoading(true);
            mutate((s) => {
              if (!s) return;
              return { ...s, ...formState };
            }, false);

            await workerAPI(WORKER_URL, "update_studio_data", {
              authToken,
              studio_id: props.id,
              name: formState.name,
              description: formState.description,
            });
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
