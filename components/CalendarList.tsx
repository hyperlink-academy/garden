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

export const CalendarList = (props: { spaces: Fact<"space/name">[] }) => {
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
          return <CalendarSpace entity={a.entity} name={a.value} key={a.id} />;
        })}
      </div>
    </div>
  );
};

const CalendarSpace = (props: { entity: string; name: string }) => {
  let studio = useIndex.eav(props.entity, "space/studio");
  let spaceID = useIndex.eav(props.entity, "space/id");
  let prefetched = useRef(false);

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
          <Door entityID={props.entity} />
        </Link>
      </div>

      <div className="">
        <div className="origin-top-left skew-y-[-30deg] scale-x-90 scale-y-110 ml-2 w-full">
          <h3 className="text-xl">{props.name}</h3>
        </div>
      </div>
    </div>
  );
};
