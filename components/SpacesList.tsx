import { spaceAPI } from "backend/lib/api";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ButtonLink } from "./Buttons";
import { CreateOrEditSpace } from "./CreateOrEditSpace";
import { Door } from "./Doors";
import { Settings } from "./Icons";
import { Modal } from "./Layout";

export const SpaceList = () => {
  let spaces = useIndex.aev("space/name");
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
  // console.log(showUnreads);
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
        <div className="absolute bottom-[4px] right-[8px] md:bottom-[80px] md:right-[62px] rotate-[-30deg]">
          {authorized ? <EditSpaceButton spaceID={props.entity} /> : null}
        </div>
        {showUnreads ? (
          <div className="inline-flex items-center gap-2 absolute bottom-[16px] right-[8px] md:bottom-[16px] md:right-[56px] rotate-[-30deg]">
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

const EditSpaceButton = (props: { spaceID: string }) => {
  let [open, setOpen] = useState(false);
  let { authorized, mutate } = useMutations();
  if (authorized === false) {
    return null;
  } else
    return (
      <>
        <a>
          <ButtonLink content="edit" onClick={() => setOpen(true)} />
        </a>
        <Modal open={open} onClose={() => setOpen(false)}>
          <CreateOrEditSpace setOpen={setOpen} spaceID={props.spaceID} />
        </Modal>
      </>
    );
};
