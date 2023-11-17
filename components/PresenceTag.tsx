import { db, scanIndex } from "hooks/useReplicache";
import { RoomMember } from "./Icons";
import { Fact } from "data/Facts";

export const PresenceTag = (props: { entityID: string; size: string }) => {
  let present = db.useQuery(
    async (tx) => {
      return (
        await Promise.all(
          (
            await scanIndex(tx).vae(props.entityID, "presence/on-card")
          ).map(async (p) => {
            let member = await scanIndex(tx).eav(
              p.entity,
              "presence/client-member"
            );
            return member?.value.value || null;
          })
        )
      ).reduce((acc, curr) => {
        if (curr && !acc.includes(curr)) {
          acc.push(curr);
        }
        return acc;
      }, [] as string[]);
    },
    [],
    [props.entityID]
  );
  console.log(present);

  return (
    <>
      <div className={`absolute -top-5 right-4 flex flex-row-reverse`}>
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
          <div className=" mt-1 flex items-center gap-0.5 rounded-t-md bg-accent-blue px-[6px]  pb-2 pt-0.5 text-xs font-bold text-white">
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
      className="relative ml-1 rounded-t-md px-1 pb-2 pt-0.5  text-xs font-bold text-white"
      style={{ backgroundColor: color?.value }}
    >
      {name?.value}
    </span>
  );
};
