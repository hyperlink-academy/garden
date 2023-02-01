import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import { useContext, useEffect, useState } from "react";
import {
  ButtonLink,
  ButtonPrimary,
  ButtonSecondary,
  ButtonTertiary,
} from "./Buttons";
import { Door, DoorSelector } from "./DoorSelector";
import { DotLoader } from "./DotLoader";
import { SettingsStudio, SpaceCreate } from "./Icons";
import { Modal } from "./Layout";

type FormState = {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  publish_on_listings_page: boolean;
  door: Door | undefined;
};
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const CreateSpace = (props: { studioSpaceID: string }) => {
  let [open, setOpen] = useState(false);
  let [formState, setFormState] = useState<FormState>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    publish_on_listings_page: false,
    door: undefined as Door | undefined,
  });
  let auth = useAuth();
  let rep = useContext(ReplicacheContext);
  return (
    <div className="mt-8 grid w-full">
      <a className="place-self-center">
        <ButtonSecondary
          icon={<SpaceCreate />}
          content="Create New Space!"
          onClick={() => setOpen(true)}
        />
      </a>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-6 overflow-y-auto">
          <CreateSpaceForm formState={formState} setFormState={setFormState} />
          {/* action buttons */}
          <div className="flex gap-4 place-self-end">
            <ButtonTertiary
              content="Nevermind"
              onClick={() => setOpen(false)}
            />

            <ButtonPrimary
              content="Create!"
              disabled={!formState.name || !formState.door}
              onClick={async () => {
                if (!auth.session.loggedIn || !formState.name) return;
                await spaceAPI(
                  `${WORKER_URL}/space/${props.studioSpaceID}`,
                  "create_space",
                  {
                    token: auth.session.token,
                    ...formState,
                  }
                );
                setFormState({
                  name: "",
                  description: "",
                  start_date: "",
                  end_date: "",
                  publish_on_listings_page: false,
                  door: undefined,
                });
                rep?.rep.pull();
                setOpen(false);
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
export const EditSpace = (props: { spaceEntity: string }) => {
  let [open, setOpen] = useState(false);
  let { authorized } = useMutations();
  let { session } = useAuth();
  let spaceID = useIndex.eav(props.spaceEntity, "space/id");
  let studio = useIndex.eav(props.spaceEntity, "space/studio");

  let name = useIndex.eav(props.spaceEntity, "space/name");
  let description = useIndex.eav(props.spaceEntity, "space/description");
  let start_date = useIndex.eav(props.spaceEntity, "space/start-date");
  let end_date = useIndex.eav(props.spaceEntity, "space/end-date");

  let door = useIndex.eav(props.spaceEntity, "space/door/image");
  let uploadedDoor = useIndex.eav(
    props.spaceEntity,
    "space/door/uploaded-image"
  );

  let [status, setStatus] = useState<"normal" | "loading">("normal");
  let [formState, setFormState] = useState<FormState>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    publish_on_listings_page: false,
    door: undefined as Door | undefined,
  });
  useEffect(() => {
    setFormState((s) => {
      let value: Door | undefined;
      if (door) value = { type: "default", value: door.value };
      if (uploadedDoor && uploadedDoor.value.filetype === "external_image")
        value = { type: "uploaded", value: uploadedDoor.value.url };

      return {
        ...s,
        start_date: start_date?.value.value || "",
        end_date: end_date?.value.value || "",
        description: description?.value || "",
        name: name?.value || "",
        door: value,
      };
    });
  }, [door, uploadedDoor, description, start_date, end_date, name]);

  let [mode, setMode] = useState<"normal" | "delete">("normal");
  if (
    authorized === false ||
    session.session?.username !== studio?.value.toLocaleLowerCase()
  ) {
    return null;
  } else
    return (
      <>
        <a>
          {/* <ButtonLink content="edit" onClick={() => setOpen(true)} /> */}
          <ButtonLink
            content=""
            icon={<SettingsStudio />}
            onClick={() => setOpen(true)}
          />
        </a>
        <Modal open={open} onClose={() => setOpen(false)}>
          {mode === "normal" ? (
            <>
              <CreateSpaceForm
                disableName
                formState={formState}
                setFormState={setFormState}
              />

              <div className="flex gap-4 place-self-end">
                <ButtonPrimary
                  content="Delete this Space"
                  destructive
                  onClick={() => setMode("delete")}
                />
                <ButtonPrimary
                  content={status === "normal" ? "Update" : <DotLoader />}
                  onClick={async () => {
                    if (!session.loggedIn || !spaceID?.value) return;
                    setStatus("loading");
                    await spaceAPI(
                      `${WORKER_URL}/space/${spaceID.value}`,
                      "update_self",
                      {
                        token: session.token,
                        data: formState,
                      }
                    );
                    setStatus("normal");
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {!spaceID ? null : (
                <DeleteSpaceForm
                  spaceEntity={props.spaceEntity}
                  onCancel={() => setMode("normal")}
                  onDelete={() => {
                    setOpen(false);
                  }}
                />
              )}
            </>
          )}
          {/* <ButtonTertiary content="Nevermind" onClick={() => setOpen(false)} /> */}
        </Modal>
      </>
    );
};

const DeleteSpaceForm = (props: {
  spaceEntity: string;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  let [state, setState] = useState({ spaceName: "" });
  let [status, setStatus] = useState<"normal" | "loading">("normal");
  let { session } = useAuth();
  let name = useIndex.eav(props.spaceEntity, "space/name");
  let spaceID = useIndex.eav(props.spaceEntity, "space/id");
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="font-bold">Type the name of this space</p>
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
          <ButtonPrimary
            onClick={async () => {
              if (name?.value !== state.spaceName) return;
              if (!spaceID || !session.token) return;
              setStatus("loading");
              await spaceAPI(
                `${WORKER_URL}/space/${spaceID.value}`,
                "delete_self",
                { token: session.token, name: state.spaceName }
              );
              setStatus("normal");
              props.onDelete();
            }}
            destructive
            disabled={name?.value !== state.spaceName}
            content={status === "normal" ? "Delete" : <DotLoader />}
          />
        </div>
      </div>
    </>
  );
};

const CreateSpaceForm = ({
  disableName,
  formState,
  setFormState,
}: {
  disableName?: boolean;
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}) => {
  let { authorized } = useMutations();

  if (authorized === false) {
    return null;
  } else
    return (
      <>
        <div className="flex flex-col gap-1">
          <p className="font-bold">Name this Space</p>
          {disableName ? (
            <h3>{formState.name}</h3>
          ) : (
            <input
              className="w-full"
              value={formState.name}
              placeholder=""
              onChange={(e) => {
                let value = e.currentTarget.value;
                setFormState((form) => ({
                  ...form,
                  name: value,
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
            value={formState.description}
            onChange={(e) => {
              let value = e.currentTarget.value;
              setFormState((form) => ({
                ...form,
                description: value,
              }));
            }}
          />
        </div>

        {/* date section */}
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="font-bold">Start Date</p>
            <input
              type="date"
              value={formState.start_date}
              onChange={(e) => {
                let value = e.currentTarget.value;
                setFormState((form) => ({
                  ...form,
                  start_date: value,
                }));
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-bold">End Date</p>

            <input
              type="date"
              value={formState.end_date}
              onChange={(e) => {
                let value = e.currentTarget.value;
                setFormState((form) => ({
                  ...form,
                  end_date: value,
                }));
              }}
            />
          </div>
        </div>

        {/* door image selector */}
        <DoorSelector
          selected={formState.door}
          onSelect={(d) => setFormState((form) => ({ ...form, door: d }))}
        />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="checkbox"
              disabled={
                !(
                  formState.start_date &&
                  formState.end_date &&
                  formState.name &&
                  formState.description &&
                  formState.door
                )
              }
              checked={formState.publish_on_listings_page}
              onChange={(e) => {
                let value = e.currentTarget.checked;
                setFormState((form) => ({
                  ...form,
                  publish_on_listings_page: value,
                }));
              }}
            />
            <p className="font-bold">Publish to Community Calendar?</p>
          </div>

          <p className="text-sm">
            Once all details are set, you can list your Space for others to see.
            People will still need an invite to join.
          </p>
        </div>
      </>
    );
};
