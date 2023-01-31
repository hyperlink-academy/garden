import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { useRef } from "react";
import { DoorImage } from "./Doors";
import { prefetchSpaceId } from "./ReplicacheProvider";
import { spacePath } from "hooks/utils";
import { Fact } from "data/Facts";

export const CalendarList = (props: {
  spaces: Fact<"space/start-date" | "space/end-date">[];
}) => {
  return (
    <div className="spacesList mt-4 flex flex-col gap-4">
      {props.spaces
        ?.sort((a, b) => (a.value.value > b.value.value ? 1 : -1))
        .map((a) => {
          return <CalendarSpace entity={a.entity} key={a.id} />;
        })}
    </div>
  );
};

const CalendarSpace = (props: { entity: string }) => {
  let studio = useIndex.eav(props.entity, "space/studio");
  let spaceID = useIndex.eav(props.entity, "space/id");

  let name = useIndex.eav(props.entity, "space/name");
  let description = useIndex.eav(props.entity, "space/description");
  let start_date = useIndex.eav(props.entity, "space/start-date");
  let end_date = useIndex.eav(props.entity, "space/end-date");
  let creator = useIndex.eav(props.entity, "space/studio");
  let prefetched = useRef(false);

  return (
    <div className="flex gap-4">
      <div className="grid grid-cols-[max-content,max-content] gap-1">
        <Link href={`${spacePath(studio?.value, name?.value)}`}>
          <DoorImage entityID={props.entity} />
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="">
            <h3
              style={{
                overflowWrap: "anywhere",
              }}
              className="text-xl"
            >
              {name?.value}
            </h3>
          </div>
          <div>
            <p className="text-grey-35">
              <strong>{start_date?.value.value}</strong> to{" "}
              <strong>{end_date?.value.value}</strong>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <p>{description?.value}</p>
          </div>
          <div className="mb-16 text-sm text-grey-35">
            <span>created by </span>
            <Link className="text-accent-blue" href={`/s/${creator?.value}`}>
              <strong>{creator?.value}</strong>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
