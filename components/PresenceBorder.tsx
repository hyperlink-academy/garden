import { db } from "hooks/useReplicache";
import { useSpring, animated, useTransition } from "@react-spring/web";

export const PresenceBorder = (props: { entityID: string }) => {
  let present = db
    .useReference(props.entityID, "presence/on-card")
    .sort((a, b) => (a.lastUpdated < b.lastUpdated ? -1 : 0))
    .map((p, index) => ({ ...p, index }))
    .reverse();
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
      <div className="absolute -top-6 right-4 flex flex-row-reverse">
        {presences((style, p) => (
          <animated.span className="absolute" style={style}>
            <Identity entityID={p.entity} index={p.index} />
          </animated.span>
        ))}
      </div>
    </>
  );
};

const Identity = (props: { entityID: string; index: number }) => {
  let memberEntity = db.useEntity(props.entityID, "presence/client-member");
  let name = db.useEntity(memberEntity?.value.value || null, "member/name");
  let color = db.useEntity(memberEntity?.value.value || null, "member/color");
  let style = useSpring({ right: props.index * 32 });

  return (
    <animated.span
      className="relative rounded-t-md px-1.5 py-1 text-xs font-bold text-white"
      style={{ ...style, backgroundColor: color?.value }}
    >
      {name?.value}
    </animated.span>
  );
};
