import { db } from "hooks/useReplicache";

export const PresenceBorder = (props: {
  children: React.ReactNode;
  entityID: string;
}) => {
  let peoplePresent = db.useReference(props.entityID, "presence/on-card");
  if (peoplePresent?.length === 0) return <>{props.children}</>;
  return (
    <div className="flex flex-col">
      <div className="text-right">
        {peoplePresent.map((person) => (
          <Identity entityID={person.entity} />
        ))}
      </div>
      <div className="flex h-max border-2 border-accent-blue">
        {props.children}
      </div>
    </div>
  );
};

const Identity = (props: { entityID: string }) => {
  let memberEntity = db.useEntity(props.entityID, "presence/client-member");
  let name = db.useEntity(memberEntity?.value.value || null, "member/name");
  return (
    <span className="rounded-t-md bg-accent-blue px-1 py-1 text-white">
      {name?.value}
    </span>
  );
};
