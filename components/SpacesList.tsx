import { spaceAPI } from "backend/lib/api";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import Link from "next/link";
import { useRef, useState } from "react";
import useSWR from "swr";
import { ButtonLink, ButtonPrimary, ButtonSecondary } from "./Buttons";
import { DoorSelector } from "components/DoorSelector";
import { Door } from "./Doors";
import { SettingsStudio } from "./Icons";
import { Modal } from "./Layout";
import { prefetchSpaceId } from "./ReplicacheProvider";
import { useAuth } from "hooks/useAuth";
import { DotLoader } from "./DotLoader";
import { spacePath } from "hooks/utils";
import { Fact } from "data/Facts";

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
  let lastSeenMessage = useIndex.eav(props.entity, "space/lastSeenMessage");
  let { authorized } = useMutations();
  let prefetched = useRef(false);

  let { data: latestMessage } = useSWR(
    `${studio?.value}/${props.name}/latestMessage`,
    async () => {
      if (!spaceID) return;
      let data = await spaceAPI(
        `${WORKER_URL}/space/${spaceID.value}`,
        "get_latest_message",
        {}
      );
      return data.latestMessage;
    }
  );

  let showUnreads =
    latestMessage && lastSeenMessage && lastSeenMessage?.value < latestMessage
      ? true
      : false;
  let unreadCount =
    latestMessage && lastSeenMessage && lastSeenMessage?.value < latestMessage
      ? latestMessage - lastSeenMessage?.value
      : null;

  return (
    <div className="w-min flex flex-col gap-4">
      <div
        className="grid grid-cols-[max-content,max-content] -ml-2 gap-1 items-end "
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
          <Door entityID={props.entity} glow={showUnreads} />
        </Link>
        <div className="flex flex-col gap-4 w-[20px] pb-[92px]">
          {showUnreads ? (
            <div className="flex flex-col ml-1.5 origin-top skew-y-[-30deg] scale-x-90 scale-y-110">
              <span className="text-sm text-grey-35">{unreadCount}</span>
              <span className="bg-accent-red rounded-full w-2 h-2"></span>
            </div>
          ) : null}
          <EditSpace spaceEntity={props.entity} />
        </div>
      </div>

      <div className="">
        <div className="origin-top-left skew-y-[-30deg] scale-x-90 scale-y-110 ml-2 w-full">
          <h3 className="text-xl">{props.name}</h3>
        </div>
        {/* extra shadow - turned off b/c it's a bit much LOL */}
        {/* <div className="origin-top -ml-4 -rotate-[30deg] skew-x-[30deg] scale-x-90 scale-y-110 blur-[1px]">
          <h3 className="text-xl text-grey-80">{props.name}</h3>
        </div> */}
      </div>
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
