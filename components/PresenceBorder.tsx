import { db } from "hooks/useReplicache";
import { useSpring, animated, useTransition } from "@react-spring/web";

export const PresenceBorder = (props: { entityID: string }) => {
  let present = db.useReference(props.entityID, "presence/on-card");
  let presences = useTransition(present, {
    keys: (p) => p.entity,
    from: { top: 32.0 },
    enter: { top: 4 },
    leave: { top: 32.0 },
    config: {
      precision: 0.1,
    },
  });
  return (
    <>
      <div className="absolute right-4 -top-6 flex flex-row-reverse">
        {presences((style, p) => (
          <animated.span className="absolute" style={style}>
            <Identity entityID={p.entity} />
          </animated.span>
        ))}
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
      className="-ml-1.5 rounded-t-md px-1.5 py-1 text-white"
      style={{ backgroundColor: color?.value }}
    >
      {name?.value}
    </span>
  );
};
