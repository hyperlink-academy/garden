import { spaceAPI } from "backend/lib/api";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ButtonLink } from "./Buttons";
import { Door } from "./Doors";
import { Settings } from "./Icons";
import { Modal } from "./Layout";

export const SpaceList = () => {
  let spaces = useIndex.aev("space/name");
  return (
    <div className="grid grid-cols-3 gap-4">
      {spaces?.map((a) => {
        return <Space entity={a.entity} name={a.value} />;
      })}
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const Space = (props: { entity: string; name: string }) => {
  let studio = useIndex.eav(props.entity, "space/studio");
  let spaceID = useIndex.eav(props.entity, "space/id");
  let lastSeenMessage = useIndex.eav(props.entity, "space/lastSeenMessage");
  let { authorized } = useMutations();

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
  // TEST
  // let showUnreads = true;
  // let unreadCount = 5;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="grid grid-cols-2 relative">
        <Link href={`/s/${studio?.value}/s/${props.name}`}>
          <a>
            <Door entityID={props.entity} glow={showUnreads} />
          </a>
        </Link>
        <div className="absolute bottom-[80px] right-[62px] rotate-[-30deg]">
          {authorized ? <EditModal entityID={props.entity} /> : null}
        </div>
        {showUnreads ? (
          <div className="inline-flex items-center gap-2 absolute bottom-[16px] right-[56px] rotate-[-30deg]">
            <span className="bg-accent-red rounded-full w-3 h-3"></span>
            <span>{unreadCount} unread</span>
          </div>
        ) : null}
      </div>

      <div className="w-full grid">
        <div className="flex flex-row justify-between gap-2">
          <h3 className="text-xl">{props.name}</h3>
        </div>
      </div>
    </div>
  );
};

let doorImages: string[] = [
  "/doors/door-clouds-256.jpg",
  "/doors/door-chicken-256.jpg",
  "/doors/door-field-256.jpg",
  "/doors/door-windowseat-256.jpg",
];

const EditModal = (props: { entityID: string }) => {
  let [open, setOpen] = useState(false);
  let image = useIndex.eav(props.entityID, "space/door/image");
  let { mutate } = useMutations();
  return (
    <>
      <a>
        <ButtonLink
          content="edit"
          // icon={<Settings />}
          onClick={() => setOpen(true)}
        />
      </a>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-wrap">
          {doorImages.map((f) => {
            return (
              <button
                onClick={() => {
                  mutate("assertFact", {
                    entity: props.entityID,
                    attribute: "space/door/image",
                    value: f,
                    positions: {},
                  });
                }}
              >
                <img className="-scale-x-100" src={f} width={64} />
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
};
