import { spaceAPI } from "backend/lib/api";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { useContext, useRef, useState } from "react";
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
import { EditSpace } from "./CreateSpace";

export const SpaceList = (props: {
  spaces: Fact<"space/start-date" | "space/end-date" | "space/name">[];
}) => {
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
          return <Space entity={a.entity} key={a.id} />;
        })}
      </div>
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const Space = (props: { entity: string }) => {
  let studio = useIndex.eav(props.entity, "space/studio");
  let name = useIndex.eav(props.entity, "space/name");

  let start_date = useIndex.eav(props.entity, "space/start-date");
  let end_date = useIndex.eav(props.entity, "space/end-date");
  let duration_days = null;
  // calculate duration, in days
  // add extra +1 day to account for start and end dates
  if (start_date && end_date) {
    let start = new Date(start_date.value.value);
    let end = new Date(end_date.value.value);
    let start_timestamp = start.getTime();
    let end_timestamp = end.getTime();
    let delta = Math.abs(end_timestamp - start_timestamp) / 1000;
    duration_days = Math.floor(delta / 86400) + 1;
  }

  let prefetched = useRef(false);

  return (
    <div className="flex w-min flex-col gap-4">
      <div
        className="-ml-2 grid grid-cols-[max-content,max-content] items-end gap-1 "
        onPointerDown={() => {
          if (prefetched.current) return;
          if (!studio?.value) return;
          if (name) prefetchSpaceId(studio.value, name?.value);
          prefetched.current = true;
        }}
        onMouseOver={() => {
          if (prefetched.current) return;
          if (!studio?.value) return;
          if (name) prefetchSpaceId(studio.value, name?.value);
          prefetched.current = true;
        }}
      >
        <Link href={`${spacePath(studio?.value, name?.value)}`}>
          <DoorImage entityID={props.entity} />
        </Link>
        <div className="flex w-[20px] flex-col gap-4 pb-[92px]">
          <EditSpace spaceEntity={props.entity} />
        </div>
      </div>

      <div className="">
        <div className="ml-2 w-full origin-top-left skew-y-[-30deg] scale-x-90 scale-y-110">
          <div className="flex flex-col gap-2">
            <h3
              style={{
                overflowWrap: "anywhere",
              }}
              className="text-xl"
            >
              {name?.value}
            </h3>
            {start_date?.value.value ? (
              <div className="text-sm text-grey-35">
                <div>
                  ❇️ <strong>{start_date?.value.value}</strong>
                </div>
                {duration_days ? (
                  <div>
                    🗓 <strong>{duration_days} days</strong>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
