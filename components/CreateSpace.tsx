import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useMutations } from "hooks/useReplicache";
import { useContext, useEffect, useState } from "react";
import { ButtonPrimary, ButtonSecondary, ButtonTertiary } from "./Buttons";
import { DoorSelector } from "./DoorSelector";
import { SpaceCreate } from "./Icons";
import { Modal } from "./Layout";
import { useSpaceData } from "hooks/useSpaceData";
import { useIdentityData } from "hooks/useIdentityData";
import { Form, SubmitButton } from "./Form";

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

  let { authorized } = useMutations();
  let [formState, setFormState] = useState<CreateSpaceFormState>({
    display_name: "",
    description: "",
    image: null,
    default_space_image: null,
  });
  let auth = useAuth();
  let rep = useContext(ReplicacheContext);
  if (!authorized) return null;
  return (
    <div className="flex gap-2">
      <a className="place-self-center">
        <ButtonSecondary
          icon={<SpaceCreate />}
          content="Create New Space!"
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
            let result = await spaceAPI(
              `${WORKER_URL}/space/${props.studioSpaceID}`,
              "create_space",
              {
                authToken: authToken,
                ...formState,
              }
            );
            if (result.success) {
              let d = result.data;
              mutate((s) => {
                if (!s) return s;
                return {
                  ...s,
                  owner: [...s.owner, d],
                };
              });
            }
            setFormState({
              display_name: "",
              description: "",
              image: null,
              default_space_image: null,
            });
            rep?.rep.pull();
            setOpen(false);
          }}
        >
          <CreateSpaceForm formState={formState} setFormState={setFormState} />
          {/* action buttons */}
          <div className="flex gap-4 place-self-end">
            <ButtonTertiary
              content="Nevermind"
              onClick={() => setOpen(false)}
            />

            <SubmitButton content="Create!" />
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export const EditSpaceModal = (props: {
  open: boolean;
  onDelete: () => void;
  onClose: () => void;
  spaceID?: string;
}) => {
  let { authToken } = useAuth();
  let { data, mutate } = useSpaceData(props.spaceID);

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
    <Modal open={props.open} onClose={props.onClose}>
      {mode === "normal" ? (
        <Form
          validate={() => {
            if (!authToken || !props.spaceID) return;
            return { authToken, spaceID: props.spaceID };
          }}
          onSubmit={async ({ authToken, spaceID }) => {
            await spaceAPI(`${WORKER_URL}/space/${spaceID}`, "update_self", {
              authToken,
              data: formState,
            });
            mutate((s) => {
              if (!s) return;
              return { ...s, ...formState };
            });
            props.onClose();
          }}
        >
          <CreateSpaceForm formState={formState} setFormState={setFormState} />

          <div className="flex gap-4 place-self-end">
            <ButtonPrimary
              content="Delete this Space"
              destructive
              onClick={() => setMode("delete")}
            />

            <ButtonSecondary
              content={"Nevermind"}
              onClick={async () => {
                props.onClose();
              }}
            />
            <SubmitButton content={"Update"} disabled={!modified} />
          </div>
        </Form>
      ) : (
        <>
          {!props.spaceID ? null : (
            <DeleteSpaceForm
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

const DeleteSpaceForm = (props: {
  spaceID: string;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  let [state, setState] = useState({ spaceName: "" });
  let { authToken } = useAuth();
  let { data } = useSpaceData(props.spaceID);
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
        <div className="flex flex-row gap-2">
          <ButtonSecondary
            onClick={async () => {
              props.onCancel();
            }}
            content="Cancel"
          />
          <SubmitButton destructive content={"Delete"} />
        </div>
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
    <>
      <div className="flex flex-col gap-1">
        <p className="font-bold">Name this Space</p>
        {disableName ? (
          <h3>{formState.display_name}</h3>
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
          className="!important box-border min-h-[90px] w-full rounded-md border border-grey-55 bg-white p-2"
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
    </>
  );
};
