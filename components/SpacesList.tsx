import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { Door } from "./Doors";

export const SpaceList = () => {
  let activites = useIndex.aev("space/name");
  return (
    <div>
      {activites?.map((a) => {
        return <Activity entity={a.entity} name={a.value} />;
      })}
    </div>
  );
};

const Activity = (props: { entity: string; name: string }) => {
  let studio = useIndex.eav(props.entity, "space/studio");
  return (
    <Link href={`/s/${studio?.value}/s/${props.name}`}>
      <a className="flex flex-row gap-4 pb-8">
        <Door />
        <h3 className="text-xl">{props.name}</h3>
      </a>
    </Link>
  );
};
