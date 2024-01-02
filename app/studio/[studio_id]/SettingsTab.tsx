import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { StudioForm } from "components/CreateStudio";
import { ButtonPrimary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { useAuth } from "hooks/useAuth";
import { spaceAPI, workerAPI } from "backend/lib/api";
import Router from "next/router";
import { ModalSubmitButton, Modal } from "components/Modal";
import { WORKER_URL } from "src/constants";


export function StudioSettings(props: {
  id: string;
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
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-3"
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
            data: {
              name: formState.name,
              description: formState.description,
            }
          });
          setLoading(false);
          mutate();
        }}
      >
        <StudioForm setFormState={setFormState} formState={formState} />
        <ButtonPrimary
          content={loading ? "" : "Update Studio"}
          icon={loading ? <DotLoader /> : undefined}
          disabled={formState.name === data?.name && formState.description === data?.description}
        />
      </form>

      <hr className="border-grey-80" />

      <div className="lightBorder flex flex-col justify-center gap-4 p-2 text-center">
        <div className="flex flex-col items-center justify-between gap-2">
          <h3>Delete Studio</h3>
          <p className="text-sm ">
            Spaces linked here will NOT be deleted; they will be
            available from their members&apos; homepages.
            <br />
            <span className="font-bold">
              You WILL lose all Studio posts / highlights.
            </span>
          </p>
          <DeleteStudioForm studioID={props.id} />
        </div>
      </div>
    </div>
  );
}

const DeleteStudioForm = (props: {
  studioID: string;
}) => {
  let [state, setState] = useState({ studioName: "" });
  let [open, setOpen] = useState(false)
  let [status, setStatus] = useState<"normal" | "loading">("normal");
  let { authToken } = useAuth();
  let { data } = useStudioData(props.studioID);
  let { session } = useAuth();

  return (
    <>
      <ButtonPrimary
        type="button"
        content="Delete Studio"
        destructive
        onClick={() => setOpen(true)}
        className="mx-auto"
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="font-bold">Type the name of this Studio</p>
            <input
              className="w-full"
              value={state.studioName}
              placeholder=""
              onChange={(e) => setState({ studioName: e.currentTarget.value })}
            />
          </div>

          <ModalSubmitButton
            content={status === "normal" ? "Delete Studio" : ""}
            icon={status === "normal" ? undefined : <DotLoader />}
            onSubmit={async () => {
              if (data?.name !== state.studioName) return;
              if (!props.studioID || !authToken) return;
              setStatus("loading");
              await spaceAPI(`${WORKER_URL}/space/${data.do_id}`, "delete_self", {
                authToken,
              });
              setStatus("normal");
              Router.push("/s/" + session.session?.username);
            }}
            disabled={data?.name !== state.studioName}
            destructive
            onClose={async () => {
              setOpen(false)
            }}
          />
        </div>
      </Modal>
    </>
  );
};
