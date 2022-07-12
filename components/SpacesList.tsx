import { spaceAPI } from "backend/lib/api";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import Link from "next/link";
import { useRef, useState } from "react";
import useSWR from "swr";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "./Buttons";
import { DoorSelector } from "components/DoorSelector";
import { Door } from "./Doors";
import { Settings, SettingsStudio } from "./Icons";
import { Modal } from "./Layout";
import { prefetchSpaceId } from "./ReplicacheProvider";

export const SpaceList = () => {
  let spaces = useIndex.aev("space/name");
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
        {spaces?.map((a) => {
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
  // TEST
  // console.log(showUnreads);
  // let showUnreads = true;
  // let unreadCount = 5;

  // flex flex-col absolute items-center bottom-[82px] left-[132px] md:left-[144px]

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
        <Link href={`/s/${studio?.value}/s/${props.name}`}>
          <a>
            <Door entityID={props.entity} glow={showUnreads} />
          </a>
        </Link>
        <div className="flex flex-col gap-4 w-[20px] pb-[92px]">
          {showUnreads ? (
            <div className="flex flex-col ml-1.5 origin-top skew-y-[-30deg] scale-x-90 scale-y-110">
              <span className="text-sm text-grey-35">{unreadCount}</span>
              <span className="bg-accent-red rounded-full w-2 h-2"></span>
            </div>
          ) : null}
          {authorized ? <EditSpace spaceID={props.entity} /> : null}
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

const EditSpace = (props: { spaceID: string }) => {
  let [open, setOpen] = useState(false);
  let { authorized, mutate } = useMutations();
  let door = useIndex.eav(props.spaceID, "space/door/image");
  if (authorized === false) {
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
          <div className="flex flex-col">
            <DoorSelector
              selected={door?.value}
              onSelect={(s) => {
                mutate("assertFact", {
                  entity: props.spaceID as string,
                  attribute: "space/door/image",
                  value: s,
                  positions: {},
                });
              }}
            />
          </div>

          {/* <ButtonTertiary content="Nevermind" onClick={() => setOpen(false)} /> */}
          <div className="flex gap-4 place-self-center">
            <ButtonPrimary content="Done!" onClick={() => setOpen(false)} />
          </div>
        </Modal>
      </>
    );
};
