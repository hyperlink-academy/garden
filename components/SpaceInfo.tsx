import { useIndex } from "hooks/useReplicache";
import { Member } from "./Icons";

export const SpaceInfo = () => {
  let spaceName = useIndex.aev("this/name")[0];

  return (
    <div className="spaceInfo grid auto-rows-max gap-3">
      <div className="spaceNameDescription grid auto-rows-max gap-2">
        <h1>{spaceName?.value}</h1>
        <Description entity={spaceName?.entity} />
      </div>
      <Members />
    </div>
  );
};

const Description = (props: { entity: string }) => {
  let description = useIndex.eav(props.entity, "this/description");
  return <p className="spaceDescription text-grey-35 ">{description?.value}</p>;
};

const Members = () => {
  let members = useIndex.aev("space/member");

  return (
    <button className="membersList grid grid-cols-[max-content_max-content] gap-2 items-center font-bold">
      <Member />
      <p>Members ({members.length})</p>
    </button>
  );
};
