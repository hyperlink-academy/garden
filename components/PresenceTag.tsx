import { db } from "hooks/useReplicache";
import { RoomMember } from "./Icons";

export const PresenceTag = (props: { entityID: string; size: string }) => {
  let present = db.useReference(props.entityID, "presence/on-card").reverse();
  return (
    <>
      <div className={`absolute -top-5 right-4 flex flex-row-reverse`}>
        {present.length > 1 && props.size === "small" ? (
          <div className="relative flex items-center gap-0.5 rounded-t-md bg-accent-blue px-[6px] pt-0.5 pb-2  text-xs font-bold text-white">
            <span>{present.length}</span>
            <span>
              {" "}
              <RoomMember />
            </span>
          </div>
        ) : (
          present
            .slice(0, props.size === "small" ? 1 : 4)
            .map((p) => <Identity entityID={p.entity} key={p.id} />)
        )}

        {props.size === "big" && present.length > 4 ? (
          <div className=" mt-1 flex items-center gap-0.5 rounded-t-md bg-accent-blue px-[6px]  pt-0.5 pb-2 text-xs font-bold text-white">
            + {present.length - 4}
            <span>
              <RoomMember />
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
};

const Identity = (props: { entityID: string }) => {
  let memberEntity = db.useEntity(props.entityID, "presence/client-member");
  let name = db.useEntity(memberEntity?.value.value || null, "member/name");
  let color = db.useEntity(memberEntity?.value.value || null, "member/color");

  return (
    <span
      className="relative ml-1 rounded-t-md px-1 pt-0.5 pb-2  text-xs font-bold text-white"
      style={{ backgroundColor: color?.value }}
    >
      {name?.value}
    </span>
  );
};
