import { db } from "hooks/useReplicache";

export const PresenceBorder = (props: {
  children: React.ReactNode;
  entityID: string;
}) => {
  return <>props.children</>;
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
