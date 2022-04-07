import { useIndex } from "hooks/useReplicache";
import { Member } from "./Icons";

export const SpaceInfo = () => {
  return (
    <div className="spaceInfo grid auto-rows-max gap-3">
      <div className="spaceNameDescription grid auto-rows-max gap-2">
        <h1>Space Name</h1>
        <p className="spaceDescription text-grey-35 ">
          A description for the space that we agreed can be up to 240 chacters
          long? Did we agree that? Where do I edit this?
        </p>
      </div>
      <button className="membersList grid grid-cols-[max-content_max-content] gap-2 items-center font-bold">
        <Member />
        <p>Members (7)</p>
      </button>
    </div>
  );
};
