import { db } from "hooks/useReplicache";

export const PresenceBorder = (props: {
  children: React.ReactNode;
  entityID: string;
}) => {
  let present = db.useReference(props.entityID, "presence/on-card");
  return (
    <>
      <div className="absolute right-4 -top-6 flex flex-row-reverse">
        {present.map((p) => (
          <Identity entityID={p.entity} key={p.id} />
        ))}
      </div>
      {props.children}
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
