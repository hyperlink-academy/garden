import { spaceAPI } from "backend/lib/api";
import {
  ReplicacheContext,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import Link from "next/link";
import { useContext, useRef, useState } from "react";
import useSWR from "swr";
import {
  ButtonLink,
  ButtonPrimary,
  ButtonSecondary,
  ButtonTertiary,
} from "./Buttons";
import { Door, DoorSelector } from "components/DoorSelector";
import { DoorImage } from "./Doors";
import { SettingsStudio, SpaceCreate } from "./Icons";
import { Modal } from "./Layout";
import { prefetchSpaceId } from "./ReplicacheProvider";
import { useAuth } from "hooks/useAuth";
import { DotLoader } from "./DotLoader";
import { spacePath } from "hooks/utils";
import { Fact } from "data/Facts";
import { Textarea } from "./Textarea";

export const SpaceList = (props: { spaces: Fact<"space/name">[] }) => {
  return (
    <div>
      <style jsx>{`
        @media (max-width: 360px) {
          .spacesList {
            place-content: space-between;
            gap: 0;
          }
        }
      `}</style>
      <div className="spacesList grid grid-cols-[repeat(auto-fill,148px)] justify-between gap-4">
        {props.spaces?.map((a) => {
          return <Space entity={a.entity} name={a.value} key={a.id} />;
        })}
      </div>
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const Space = (props: { entity: string; name: string }) => {
  let studio = useIndex.eav(props.entity, "space/studio");
  let spaceID = useIndex.eav(props.entity, "space/id");
  let prefetched = useRef(false);

  return (
    <div className="flex w-min flex-col gap-4">
      <div
        className="-ml-2 grid grid-cols-[max-content,max-content] items-end gap-1 "
        onPointerDown={() => {
          if (prefetched.current) return;
          if (!studio?.value) return;
          prefetchSpaceId(studio.value, props.name);
          prefetched.current = true;
        }}
        onMouseOver={() => {
          if (prefetched.current) return;
          if (!studio?.value) return;
          prefetchSpaceId(studio.value, props.name);
          prefetched.current = true;
        }}
      >
        <Link href={`${spacePath(studio?.value, props.name)}`}>
          <DoorImage entityID={props.entity} />
        </Link>
        <div className="flex w-[20px] flex-col gap-4 pb-[92px]">
          <EditSpace spaceEntity={props.entity} />
        </div>
      </div>

      <div className="">
        <div className="ml-2 w-full origin-top-left skew-y-[-30deg] scale-x-90 scale-y-110">
          <h3 className="text-xl">{props.name}</h3>
        </div>
      </div>
    </div>
  );
};

export const CreateSpace = (props: { studioSpaceID: string }) => {
  let [open, setOpen] = useState(false);
  let [formState, setFormState] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    publish_on_listings_page: false,
    door: undefined as Door | undefined,
  });

  let auth = useAuth();
  let { authorized } = useMutations();
  let rep = useContext(ReplicacheContext);

  if (authorized === false) {
    return null;
  } else
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
          <div className="flex flex-col gap-6 overflow-y-scroll">
            {/* space name */}
            <div className="flex flex-col gap-1">
              <p className="font-bold">Name this Space</p>
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
            <div className="flex justify-between gap-2">
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

            <div className="flex flex-row gap-1">
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

const EditSpace = (props: { spaceEntity: string }) => {
  let [open, setOpen] = useState(false);
  let { authorized } = useMutations();
  let { session } = useAuth();
  let door = useIndex.eav(props.spaceEntity, "space/door/image");
  let spaceID = useIndex.eav(props.spaceEntity, "space/id");
  let studio = useIndex.eav(props.spaceEntity, "space/studio");
  let completed = useIndex.eav(props.spaceEntity, "space/completed");
  let [mode, setMode] = useState<"normal" | "delete">("normal");

  let uploadedDoor = useIndex.eav(
    props.spaceEntity,
    "space/door/uploaded-image"
  );
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
              <div className="flex flex-col">
                <DoorSelector
                  selected={
                    uploadedDoor
                      ? {
                          type: "uploaded",
                          value:
                            uploadedDoor.value.filetype === "image"
                              ? uploadedDoor.value.id
                              : uploadedDoor.value.url,
                        }
                      : door
                      ? { type: "default", value: door.value }
                      : undefined
                  }
                  onSelect={async (s) => {
                    //Call SpaceAPI
                    if (!spaceID || !session.token) return;
                    await spaceAPI(
                      `${WORKER_URL}/space/${spaceID.value}`,
                      "update_self",
                      { token: session.token, data: { image: s } }
                    );
                  }}
                />
              </div>

              <ButtonPrimary
                content={completed?.value ? "Mark Active" : "Mark Complete"}
                onClick={async () => {
                  if (!spaceID || !session.token) return;
                  console.log(completed);
                  if (completed?.value) {
                    console.log(
                      await spaceAPI(
                        `${WORKER_URL}/space/${spaceID.value}`,
                        "update_self",
                        { token: session.token, data: { completed: false } }
                      )
                    );
                  } else {
                    await spaceAPI(
                      `${WORKER_URL}/space/${spaceID.value}`,
                      "update_self",
                      { token: session.token, data: { completed: true } }
                    );
                  }
                }}
              />
              <ButtonPrimary
                content="Delete this Space"
                destructive
                onClick={() => setMode("delete")}
              />
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
