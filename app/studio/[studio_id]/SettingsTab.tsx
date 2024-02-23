import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { useAuth } from "hooks/useAuth";
import { spaceAPI, workerAPI } from "backend/lib/api";
import { useRouter } from "next/navigation";
import { ModalSubmitButton, Modal } from "components/Modal";
import { WORKER_URL } from "src/constants";
import { AddSmall, CloseLinedTiny, Delete } from "components/Icons";
import { db, useMutations } from "hooks/useReplicache";
import { ulid } from "src/ulid";
import { generateNKeysBetween } from "src/fractional-indexing";

export function StudioSettings(props: { id: string }) {
  let { session, authToken } = useAuth();
  let { data, mutate } = useStudioData(props.id);
  let [loading, setLoading] = useState(false);
  let [formState, setFormState] = useState({
    name: "",
    description: "",
    allow_members_to_join_spaces: false,
  });
  let [mode, setMode] = useState<"normal" | "delete">("normal");

  useEffect(() => {
    setFormState({
      description: data?.description || "",
      name: data?.name || "",
      allow_members_to_join_spaces: data?.allow_members_to_join_spaces || false,
    });
  }, [data]);
  return (
    <div className="settingsWrapper no-scrollbar mx-auto flex h-full max-w-2xl flex-col gap-8 overflow-y-scroll pb-8 sm:pt-7">
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
              allow_members_to_join_spaces:
                formState.allow_members_to_join_spaces,
            },
          });
          setLoading(false);
          mutate();
        }}
      >
        <div className="lightBorder flex flex-col gap-6 p-3">
          <StudioNameForm setFormState={setFormState} formState={formState} />
          <OpenSpacesForm setFormState={setFormState} formState={formState} />
        </div>
        <ButtonPrimary
          className=" place-self-end"
          content={loading ? "" : "Update Studio"}
          icon={loading ? <DotLoader /> : undefined}
          disabled={
            formState.name === data?.name &&
            formState.description === data?.description &&
            formState.allow_members_to_join_spaces ===
              data?.allow_members_to_join_spaces
          }
        />
      </form>
      <GetStartedForm />

      <hr className="border-grey-80" />

      <div className="lightBorder flex flex-col items-center gap-2 p-3 text-center">
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

type FormState = {
  name: string;
  description: string;
  allow_members_to_join_spaces: boolean;
};

const StudioNameForm = ({
  formState,
  setFormState,
}: {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}) => {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h4 className="font-bold">Name this Studio</h4>
        <div className="flex flex-col gap-0.5">
          <input
            className="w-full"
            maxLength={64}
            value={formState.name}
            onChange={(e) => {
              let value = e.currentTarget.value;
              setFormState((form) => ({
                ...form,
                name: value,
              }));
            }}
          />
          <div className="text-xs italic text-grey-55">
            {formState.name.length}/64
          </div>
        </div>
      </div>
    </>
  );
};

const OpenSpacesForm = ({
  formState,
  setFormState,
}: {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}) => {
  return (
    <div className=" flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h4>Open Spaces</h4>
        <div className="flex flex-col gap-2 text-sm text-grey-35">
          <p>
            Studio members can comment and chat in Spaces in the Studio, but{" "}
            <b>cannot make or edit cards</b> in them unless they join each
            Space.
          </p>
          <p>
            <b>
              If you enable this setting, members will be able to join any
              Spaces
            </b>{" "}
            in this Studio without needing an explicit invite link.
          </p>
        </div>
      </div>
      <div className="flex gap-2 font-bold">
        <input
          type="checkbox"
          id="open-space-toggle"
          checked={formState.allow_members_to_join_spaces}
          onChange={(e) =>
            setFormState({
              ...formState,
              allow_members_to_join_spaces: e.currentTarget.checked,
            })
          }
        />
        Open Spaces to Members
      </div>
    </div>
  );
};

const GetStartedForm = () => {
  let [getStarted, setGetStarted] = useState(false);
  let [getStartedInput, setGetStartedInput] = useState("");
  let [getStartedItems, setGetStartedItems] = useState<
    { id: string; value: string }[]
  >([]);

  let { mutate } = useMutations();
  let home = db.useAttribute("home")[0];
  let existingGetStartedItems =
    db.useEntity(home?.entity, "checklist/item") || [];
  useEffect(() => {
    if (existingGetStartedItems.length === 0) {
      setGetStarted(false);

      setGetStartedItems([
        {
          id: ulid(),
          value:
            "Introduce yourself! Write a short bio on your member card in the 'Members' tab",
        },
        {
          id: ulid(),
          value: "Create your first Space in the 'Spaces' tab!",
        },
      ]);
    } else {
      setGetStarted(true);
      setGetStartedItems(
        existingGetStartedItems.map((f) => ({
          id: f.id,
          value: f.value,
        }))
      );
    }
  }, [existingGetStartedItems]);

  let newItems =
    getStartedItems.reduce((acc, item) => {
      return (
        acc || !existingGetStartedItems?.find((i) => i.value === item.value)
      );
    }, false) || getStartedItems.length !== existingGetStartedItems?.length;

  return (
    <div className="flex w-full flex-col place-items-end gap-3">
      <div className="settingsGetStarted lightBorder flex flex-col gap-4 p-3">
        <div className="flex flex-col gap-2">
          <h4>Get Started</h4>
          <p className="text-sm text-grey-35">
            If you enable this,{" "}
            <b>new members will see a &quot;Get Started&quot; tab </b>
            when they join. Add an onboarding checklist so new members know
            where to start!
          </p>
          <p className="text-sm text-grey-35">
            The tab will be visible until all items are checked off.
          </p>
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
          <div className="flex flex-col gap-2">
            {getStartedItems.map((item, i) => (
              <div
                key={item.id}
                className="lightBorder flex items-start gap-2 p-2"
              >
                <div className="grow">{item.value}</div>
                <button
                  className="pt-1 text-grey-55 hover:text-accent-blue"
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
            <div className="mt-3 flex w-full items-center gap-2">
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
                    setGetStartedItems((s) => [
                      ...s,
                      { id: ulid(), value: getStartedInput },
                    ]);
                    setGetStartedInput("");
                  } else return;
                }}
              />
              <button
                className="pr-1 text-accent-blue"
                onClick={(e) => {
                  e.preventDefault();
                  if (getStartedInput !== "") {
                    setGetStartedItems((s) => [
                      ...s,
                      { id: ulid(), value: getStartedInput },
                    ]);
                    setGetStartedInput("");
                    document.getElementById("get-started-input")?.focus();
                  }
                }}
              >
                <AddSmall />
              </button>
            </div>
          </div>
        )}
      </div>
      <ButtonPrimary
        content="Update Get Started"
        disabled={
          !(newItems || (existingGetStartedItems.length > 0 && !getStarted))
        }
        onClick={async () => {
          for (let existing of existingGetStartedItems) {
            await mutate("retractFact", {
              id: existing.id,
            });
          }
          if (!getStarted && existingGetStartedItems) {
            return;
          }
          let positionKeys = generateNKeysBetween(
            null,
            null,
            getStartedItems.length
          );
          mutate(
            "assertFact",
            getStartedItems.map((item, index) => ({
              entity: home.entity,
              attribute: "checklist/item",
              value: item.value,
              factID: item.id,
              positions: { eav: positionKeys[index] },
            }))
          );
        }}
      />
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
