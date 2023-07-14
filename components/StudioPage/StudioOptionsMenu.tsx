import { MoreOptionsSmall } from "components/Icons";
import * as Popover from "@radix-ui/react-popover";
import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { Modal } from "components/Layout";
import { StudioForm } from "components/CreateStudio";
import { ButtonLink, ButtonPrimary, ButtonSecondary } from "components/Buttons";
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
      <button
        onClick={() => setStudioSettingsModalOpen(true)}
        className="shrink-0 rounded-md border border-transparent pt-[1px] hover:border-accent-blue hover:text-accent-blue"
      >
        <MoreOptionsSmall />
      </button>

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

  let [mode, setMode] = useState<"normal" | "delete">("normal");

  useEffect(() => {
    setFormState({
      description: data?.description || "",
      name: data?.name || "",
    });
  }, [data?.description, data?.name]);
  return (
    <Modal open={props.open} onClose={props.onClose}>
      {mode === "normal" ? (
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
              onClick={props.onClose}
            />
          </div>
          {data?.creator === session?.user?.id ? (
            <>
              <hr className="border-grey-80" />
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center justify-between gap-4">
                  <h3>Delete Studio</h3>
                </div>
                <p className="text-grey-55">
                  Spaces linked here will NOT be deleted; they will be available
                  from their members&apos; homepages.
                </p>
                <p className="text-grey-55">
                  You WILL lose all Studio posts / highlights.
                </p>
                <div className="flex flex-row justify-end">
                  <ButtonPrimary
                    content="Delete Studio"
                    destructive
                    onClick={() => setMode("delete")}
                  />
                </div>
              </div>
            </>
          ) : null}
        </form>
      ) : (
        <>
          {!props.id ? null : (
            <DeleteStudioForm
              studioID={props.id}
              onCancel={() => setMode("normal")}
            />
          )}
        </>
      )}
    </Modal>
  );
}

const DeleteStudioForm = (props: {
  studioID: string;
  onCancel: () => void;
}) => {
  let [state, setState] = useState({ studioName: "" });
  let [status, setStatus] = useState<"normal" | "loading">("normal");
  let { authToken } = useAuth();
  let { data } = useStudioData(props.studioID);
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-bold">Type the name of this Studio</p>
        <input
          className="w-full"
          value={state.studioName}
          placeholder=""
          onChange={(e) => setState({ studioName: e.currentTarget.value })}
        />
        <div className="flex flex-row gap-2">
          <ButtonSecondary
            onClick={async () => {
              props.onCancel();
            }}
            content="Cancel"
          />
          <ButtonPrimary
            onClick={async () => {
              if (data?.name !== state.studioName) return;
              if (!props.studioID || !authToken) return;
              setStatus("loading");
              await spaceAPI(
                `${WORKER_URL}/space/${data.do_id}`,
                "delete_self",
                { authToken }
              );
              setStatus("normal");
              Router.push(`/`);
            }}
            destructive
            disabled={data?.name !== state.studioName}
            content={status === "normal" ? "Delete" : <DotLoader />}
          />
        </div>
      </div>
    </>
  );
};
