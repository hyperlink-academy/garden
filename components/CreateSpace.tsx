import { spaceAPI, workerAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext } from "hooks/useReplicache";
import { useContext, useEffect, useState } from "react";
import { ButtonPrimary, ButtonSecondary } from "./Buttons";
import { DoorSelector } from "./DoorSelector";
import { SpaceCreate } from "./Icons";
import { Modal } from "./Modal";
import { useRouter } from "next/navigation";

import { useSpaceData } from "hooks/useSpaceData";
import { useIdentityData } from "hooks/useIdentityData";
import { Form, SubmitButton } from "./Form";
import { DotLoader } from "./DotLoader";
import { spacePath, useIsMobile } from "hooks/utils";

export type CreateSpaceFormState = {
  display_name: string;
  description: string;
  image: string | null;
  default_space_image: string | null;
};
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const CreateSpace = (props: {
  studioSpaceID: string;
  studioName: string;
}) => {
  let { mutate } = useIdentityData(props.studioName);
  let [open, setOpen] = useState(false);

  let [formState, setFormState] = useState<CreateSpaceFormState>({
    display_name: "",
    description: "",
    image: null,
    default_space_image: null,
  });
  let auth = useAuth();
  let rep = useContext(ReplicacheContext);
  let router = useRouter();
  let isMobile = useIsMobile();
  return (
    <>
      <a className="flex w-fit">
        <ButtonSecondary
          className="mx-auto"
          icon={<SpaceCreate />}
          content={"Create"}
          onClick={() => setOpen(true)}
        />
      </a>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Form
          validate={() => {
            if (
              !auth.session.loggedIn ||
              !auth.authToken ||
              !formState.display_name ||
              !(formState.image || formState.default_space_image)
            )
              return;
            return { authToken: auth.authToken };
          }}
          className="flex flex-col gap-6 overflow-y-auto"
          onSubmit={async ({ authToken }) => {
            let result = await workerAPI(WORKER_URL, "create_space", {
              authToken: authToken,
              ...formState,
            });
            if (result.success) {
              let d = result.data;
              mutate((s) => {
                if (!s) return s;
                return {
                  ...s,
                  owner: [...s.owner, d],
                };
              });
              router.push(
                spacePath({
                  studio: d.owner.username,
                  id: d.id,
                  display_name: d.display_name,
                })
              );
            }
            setFormState({
              display_name: "",
              description: "",
              image: null,
              default_space_image: null,
            });
            rep?.rep.pull();
            // setOpen(false);
          }}
        >
          <CreateSpaceForm formState={formState} setFormState={setFormState} />
          {/* action buttons */}

          <SubmitButton content="Create!" onClose={() => setOpen(false)} />
        </Form>
      </Modal>
    </>
  );
};

export const EditSpaceModal = (props: {
  open: boolean;
  onSubmit?: () => void;
  onDelete: () => void;
  onClose: () => void;
  spaceID?: string;
  space_id: string;
}) => {
  let { authToken } = useAuth();
  let { data, mutate } = useSpaceData({ space_id: props.space_id });

  let [formState, setFormState] = useState<CreateSpaceFormState>({
    display_name: "",
    description: "",
    image: null,
    default_space_image: null,
  });
  let modified =
    formState.display_name !== data?.display_name ||
    formState.description !== data?.description ||
    JSON.stringify(formState.image) !== JSON.stringify(data.image);

  useEffect(() => {
    setFormState((s) => {
      return {
        ...s,
        display_name: data?.display_name || "",
        description: data?.description || "",
        start_date: data?.start_date || "",
        end_date: data?.end_date || "",
        image: data?.image || null,
        default_space_image: data?.default_space_image || null,
      };
    });
  }, [data]);

  let [mode, setMode] = useState<"normal" | "delete">("normal");
  return (
    <Modal
      header={mode === "normal" ? `Space Settings` : `Delete Space?`}
      open={props.open}
      onClose={() => {
        props.onClose();
        setMode("normal");
      }}
    >
      {mode === "normal" ? (
        <Form
          className="flex flex-col gap-4"
          validate={() => {
            if (!authToken) return;
            return { authToken };
          }}
          onSubmit={async ({ authToken }) => {
            await workerAPI(WORKER_URL, "update_space", {
              space_id: props.space_id,
              authToken,
              data: formState,
            });
            mutate((s) => {
              if (!s) return;
              return { ...s, ...formState };
            });
            if (formState.display_name !== data?.display_name && data) {
              window.history.replaceState(
                null,
                "",
                spacePath({
                  studio: data.owner.username,
                  id: data.id,
                  display_name: formState.display_name,
                })
              );
            }
            props.onSubmit?.();
            props.onClose();
          }}
        >
          {/* main space settings e.g. name, description, img */}
          <CreateSpaceForm formState={formState} setFormState={setFormState} />

          {/* update or nevermind */}
          <SubmitButton content="Update!" onClose={async () => props.onClose} />

          <hr className="border-grey-80" />

          {/* archive + delete section */}
          <div className="flex flex-col gap-2">
            <div
              className={`border-grey-80 mx-auto flex w-full flex-col rounded-md border  p-2 text-center ${
                data?.archived ? "bg-grey-90" : "bg-bg-blue"
              }`}
            >
              {data?.archived ? (
                <>
                  <p className="font-bold">This Space is Archived</p>
                  <p className="text-grey-35 mb-4 text-sm">
                    But you can still edit it at any time!
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">This Space is Active</p>
                  <p className="text-grey-35 mb-4 text-sm">
                    It&apos;ll appear in the active section on your homepage
                  </p>
                </>
              )}
              <div className="mx-auto">
                <ArchiveButton
                  space_id={props.space_id}
                  spaceID={props.spaceID}
                  onSubmit={props.onSubmit}
                />
              </div>
            </div>
            <div className="border-grey-80 mx-auto flex w-full flex-col rounded-md border p-2 text-center">
              <p className="text-grey-35 text-sm">
                Deleting is permanent and will remove <br />
                EVERYTHING from this space
              </p>
              <div className="mx-auto mt-2">
                <ButtonPrimary
                  content="Delete this Space"
                  destructive
                  onClick={() => setMode("delete")}
                />
              </div>
            </div>
          </div>
        </Form>
      ) : (
        <>
          {!props.spaceID ? null : (
            <DeleteSpaceForm
              space_id={props.space_id}
              spaceID={props.spaceID}
              onCancel={() => setMode("normal")}
              onDelete={() => {
                props.onDelete();
              }}
            />
          )}
        </>
      )}
    </Modal>
  );
};

const ArchiveButton = (props: {
  spaceID?: string;
  onSubmit?: () => void;
  space_id: string;
}) => {
  let { data, mutate } = useSpaceData(props);
  let { authToken } = useAuth();
  let [loading, setLoading] = useState(false);
  return (
    <ButtonSecondary
      type="button"
      onClick={async () => {
        console.log({
          loading,
          data,
          spaceID: props.spaceID,
          authToken: !authToken,
        });
        if (loading || !data || !props.spaceID || !authToken) return;
        setLoading(true);
        await workerAPI(WORKER_URL, "update_space", {
          authToken,
          space_id: props.space_id,
          data: {
            ...data,
            display_name: data?.display_name || "",
            description: data.description || "",
            archived: !data.archived,
          },
        });
        mutate();
        props.onSubmit?.();
        setLoading(false);
      }}
      content={
        loading ? (
          <DotLoader />
        ) : data?.archived ? (
          "Re-Activate this Space"
        ) : (
          "Archive this Space"
        )
      }
    />
  );
};

const DeleteSpaceForm = (props: {
  spaceID: string;
  space_id: string;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  let [state, setState] = useState({ spaceName: "" });
  let { authToken } = useAuth();
  let { data } = useSpaceData({ space_id: props.space_id });
  return (
    <>
      <Form
        className="flex flex-col gap-2"
        validate={() => {
          if (data?.display_name !== state.spaceName) return;
          if (!props.spaceID || !authToken) return;
          return { spaceID: props.spaceID, authToken };
        }}
        onSubmit={async ({ authToken, spaceID }) => {
          await spaceAPI(`${WORKER_URL}/space/${spaceID}`, "delete_self", {
            authToken,
          });
          props.onDelete();
        }}
      >
        <p className="font-bold">Type the name of this Space</p>
        <input
          className="w-full"
          value={state.spaceName}
          placeholder=""
          onChange={(e) => setState({ spaceName: e.currentTarget.value })}
        />

        <SubmitButton
          destructive
          content={"Delete"}
          onClose={async () => props.onCancel()}
        />
      </Form>
    </>
  );
};

export const CreateSpaceForm = ({
  disableName,
  formState,
  setFormState,
}: {
  disableName?: boolean;
  formState: CreateSpaceFormState;
  setFormState: React.Dispatch<React.SetStateAction<CreateSpaceFormState>>;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-bold">Name this Space</p>
        {disableName ? (
          <h4>{formState.display_name}</h4>
        ) : (
          <input
            className="w-full"
            value={formState.display_name}
            placeholder=""
            onChange={(e) => {
              let value = e.currentTarget.value;
              setFormState((form) => ({
                ...form,
                display_name: value,
              }));
            }}
          />
        )}
      </div>

      {/* space description */}
      <div className="flex flex-col gap-1">
        <p className="font-bold">Add a Description</p>
        {/* NB: Textarea component = broken w/o placeholder */}
        <textarea
          className="!important border-grey-55 box-border min-h-[90px] w-full rounded-md border bg-white p-2"
          placeholder=""
          maxLength={256}
          value={formState.description}
          onChange={(e) => {
            let value = e.currentTarget.value;
            setFormState((form) => ({
              ...form,
              description: value,
            }));
          }}
        />
        <div className="text-xs italic">{formState.description.length}/256</div>
      </div>

      {/* door image selector */}
      <DoorSelector
        uploadedImage={formState.image}
        selected={formState.image || formState.default_space_image}
        onSelect={(d) =>
          setFormState((form) => {
            if (d.filetype === "image")
              return { ...form, image: d.id, default_space_image: null };
            else
              return {
                ...form,
                image: null,
                default_space_image: d.url,
              };
          })
        }
      />
      {/* space visibility */}
      {/* TODO: add actual public vs. private setting here */}
      <div className="flex flex-col gap-1">
        <p className="font-bold">Visibility</p>
        <div className="bg-bg-gold flex flex-col gap-2 rounded-md p-4 text-sm italic">
          <p className="font-bold">Note: Spaces are publicly viewable.</p>
          <p>Private Spaces are coming soon 🔐🌱</p>
        </div>
      </div>
    </div>
  );
};
