import { db } from "hooks/useReplicache";
import {
  useSpring,
  animated,
  useTransition,
  useResize,
} from "@react-spring/web";
import { Room } from "./Room";
import { RoomMember } from "./Icons";

export const PresenceTag = (props: { entityID: string; size: string }) => {
  let present = db.useReference(props.entityID, "presence/on-card").reverse();
  let presences = useTransition(
    present.slice(0, props.size === "small" ? 1 : 4),
    {
      keys: (p) => p.entity,
      from: { top: 32.0 },
      enter: { top: 4 },
      leave: { top: 32.0 },
      config: {
        precision: 0.1,
      },
    }
  );
  return (
    <>
      <div
        className={`absolute  flex flex-row-reverse ${
          props.size === "small" ? "-top-6 right-4" : "-top-6 right-0"
        }`}
      >
        {presences((style, p, transitionState) => {
          console.log(transitionState);
          return (
            <animated.span className="relative" style={style}>
              {present.length > 1 && props.size === "small" ? (
                <div className="relative flex items-center gap-0.5 rounded-t-md bg-accent-blue px-[6px] pt-0.5 pb-2  text-xs font-bold text-white">
                  <span>{present.length}</span>
                  <span>
                    {" "}
                    <RoomMember />
                  </span>
                </div>
              ) : (
                <Identity
                  entityID={p.entity}
                  index={0}
                  leaving={transitionState.phase !== "enter"}
                />
              )}
            </animated.span>
          );
        })}
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

const Identity = (props: {
  entityID: string;
  index: number;
  leaving: boolean;
}) => {
  let memberEntity = db.useEntity(props.entityID, "presence/client-member");
  let name = db.useEntity(memberEntity?.value.value || null, "member/name");
  let color = db.useEntity(memberEntity?.value.value || null, "member/color");

  return (
    <animated.span className="overflow-hidden">
      <animated.span
        className="relative ml-1 rounded-t-md px-1 pt-0.5 pb-2  text-xs font-bold text-white"
        style={{ backgroundColor: color?.value }}
      >
        {name?.value}
      </animated.span>
    </animated.span>
  );
};
