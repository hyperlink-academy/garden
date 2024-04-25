import { db, scanIndex } from "hooks/useReplicache";
import { RoomMember } from "./Icons";
import { Fact } from "data/Facts";
import { filterFactsByPresences } from "src/utils";
import { useConnectedClientIDs } from "./ReplicacheProvider";

export const PresenceTag = (props: {
  entityID: string;
  size: string;
  outerControls: boolean;
}) => {
  let p = useConnectedClientIDs();
  let present = db.useQuery(
    async (tx) => {
      let presencesOnCard = await filterFactsByPresences(
        await scanIndex(tx).vae(props.entityID, "presence/on-card"),
        p,
        tx
      );
      let uniqueMembers: string[] = [];
      for (let presence of presencesOnCard) {
        let member = await scanIndex(tx).eav(
          presence.entity,
          "presence/client-member"
        );
        if (member && !uniqueMembers.includes(member.value.value))
          uniqueMembers.push(member.value.value);
      }
      return uniqueMembers;
    },
    [],
    [props.entityID, p]
  );

  return (
    <>
      <div
        className={`absolute -top-5  ${
          props.outerControls ? "right-1" : "right-5"
        } flex flex-row-reverse`}
      >
        {present.length > 1 && props.size === "small" ? (
          <div className="relative flex items-center gap-0.5 rounded-t-md bg-accent-blue px-[6px] pb-2 pt-0.5  text-xs font-bold text-white">
            <span>{present.length}</span>
            <span>
              {" "}
              <RoomMember />
            </span>
          </div>
        ) : (
          present
            .slice(0, props.size === "small" ? 1 : 4)
            .map((p) => <Identity entityID={p} key={p} />)
        )}

        {props.size === "big" && present.length > 4 ? (
          <div className=" mt-1 flex items-center gap-0.5 rounded-t-md  bg-accent-blue px-[6px] pb-2 pt-0.5 text-xs font-bold text-white">
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
  let name = db.useEntity(props.entityID || null, "member/name");
  let color = db.useEntity(props.entityID || null, "member/color");

  return (
    <span
      className=" relative rounded-t-md border-2 border-white px-1 pb-2 text-xs font-bold text-white"
      style={{ backgroundColor: color?.value }}
    >
      {name?.value}
    </span>
  );
};
