import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { StudioForm } from "components/CreateStudio";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { useAuth } from "hooks/useAuth";
import { spaceAPI, workerAPI } from "backend/lib/api";
import { useRouter } from "next/navigation";
import { ModalSubmitButton, Modal } from "components/Modal";
import { WORKER_URL } from "src/constants";
import { CloseLinedTiny, Delete } from "components/Icons";

export function StudioSettings(props: { id: string }) {
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pb-6 sm:pt-6">
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
            },
          });
          setLoading(false);
          mutate();
        }}
      >
        <StudioForm setFormState={setFormState} formState={formState} />
        <ButtonPrimary
          className="mt-8 place-self-end"
          content={loading ? "" : "Update Studio"}
          icon={loading ? <DotLoader /> : undefined}
          disabled={
            formState.name === data?.name &&
            formState.description === data?.description
          }
        />
      </form>
      <GetStartedForm />

      <hr className="border-grey-80" />

      <div className="lightBorder flex flex-col items-center gap-2 p-4 text-center">
        <h3>Delete Studio</h3>
        <p className="text-sm">
          Spaces will <strong>not</strong> be deleted; they will be available
          from their members&apos; homepages.
        </p>
        <div className="items-right my-1 justify-end">
          <DeleteStudioForm studioID={props.id} />
        </div>
      </div>
    </div>
  );
}

const GetStartedForm = () => {
  let [getStarted, setGetStarted] = useState(false);
  let [getStartedInput, setGetStartedInput] = useState("");
  let [getStartedItems, setGetStartedItems] = useState([
    "Introduce yourself! Write a short bio on your member card in the Members tab!",
    "Create your first space in the Space Tab!",
  ]);

  return (
    <div className="settingsGetStarted flex flex-col gap-2">
      <div className="flex flex-col gap-0.5 ">
        <h4>Get Started</h4>
        <div className="text-grey-35 text-sm">
          If you use this, new members will see a &quot;Get Started&quot; tab
          when they join the studio. Use it to create an onboarding checklist so
          new members know what to do when they join! <br />
          The tab will be visible until all items are checked off.
        </div>
      </div>
      <div className="flex gap-2 font-bold">
        <input
          type="checkbox"
          id="getting-started-toggle"
          checked={getStarted}
          onChange={(e) => setGetStarted(e.currentTarget.checked)}
        />
        Use Get Started
      </div>
      {getStarted && (
        <div className="flex flex-col gap-3">
          {getStartedItems.map((item, i) => (
            <div key={i} className="lightBorder flex items-start gap-2 p-2">
              <div className="text-grey-35 grow">{item}</div>
              <button
                className="hover:text-accent-blue text-grey-55 pt-1"
                onClick={() => {
                  setGetStartedItems((s) => {
                    let newItems = [...s];
                    newItems.splice(i, 1);
                    return newItems;
                  });
                }}
              >
                <CloseLinedTiny className="shrink-0 grow-0" />
              </button>
            </div>
          ))}
          <div className="mt-3 flex w-full gap-2">
            <input
              className="grow"
              id="get-started-input"
              value={getStartedInput}
              onChange={(e) => {
                setGetStartedInput(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && getStartedInput !== "") {
                  // e.preventDefault();
                  setGetStartedItems((s) => [...s, getStartedInput]);
                  setGetStartedInput("");
                  console.log(getStartedItems);
                } else return;
              }}
            />
            <ButtonSecondary
              content="Add"
              onClick={(e) => {
                e.preventDefault();
                if (getStartedInput !== "") {
                  setGetStartedItems((s) => [...s, getStartedInput]);
                  setGetStartedInput("");
                  console.log(getStartedItems);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
const DeleteStudioForm = (props: { studioID: string }) => {
  let router = useRouter();
  let [state, setState] = useState({ studioName: "" });
  let [open, setOpen] = useState(false);
  let [status, setStatus] = useState<"normal" | "loading">("normal");
  let { authToken } = useAuth();
  let { data } = useStudioData(props.studioID);
  let { session } = useAuth();

  return (
    <>
      <ButtonPrimary
        type="button"
        content="Delete Studio"
        icon={status === "normal" ? <Delete /> : <DotLoader />}
        destructive
        onClick={() => setOpen(true)}
        className="mx-auto"
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
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
            icon={status === "normal" ? <Delete /> : <DotLoader />}
            onSubmit={async () => {
              if (data?.name !== state.studioName) return;
              if (!props.studioID || !authToken) return;
              setStatus("loading");
              await spaceAPI(
                `${WORKER_URL}/space/${data.do_id}`,
                "delete_self",
                {
                  authToken,
                }
              );
              setStatus("normal");
              router.push("/s/" + session.session?.username);
            }}
            disabled={data?.name !== state.studioName}
            destructive
            onClose={async () => {
              setOpen(false);
            }}
          />
        </div>
      </Modal>
    </>
  );
};
