import { SmallCardList } from "components/SmallCardList";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";

export default function ActivityPage() {
  let { query } = useRouter();
  return <Activity entity={query.activity as string} />;
}

export const Activity = (props: { entity: string }) => {
  let name = useIndex.eav(props.entity, "activity/name");
  return (
    <div style={{ width: "100vw" }}>
      <h1>{name?.value}</h1>
      <h2>In Hand</h2>
      <Hand entity={props.entity} />
    </div>
  );
};

const Hand = (props: { entity: string }) => {
  let cards = useIndex.eav(props.entity, "activity/hand-contains");
  return (
    <div className="overflow-x-auto p-4" style={{ width: "100%" }}>
      <SmallCardList
        horizontal
        cards={cards || []}
        deck={props.entity}
        attribute="activity/hand-contains"
        positionKey="eav"
      />
    </div>
  );
};
