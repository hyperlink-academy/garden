import { SmallCardList } from "components/SmallCardList";
import { ref } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useInActivity } from "hooks/useInActivity";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { MessageInput, Messages } from "../chat";

export default function ActivityPage() {
  let { query } = useRouter();
  return <Activity entity={query.activity as string} />;
}

export const Activity = (props: { entity: string }) => {
  let name = useIndex.eav(props.entity, "activity/name");
  let { mutate, authorized, memberEntity } = useMutations();

  let inActivity = useInActivity();
  useEffect(() => {
    if (!memberEntity) return;
    if (authorized && inActivity?.value.value !== props.entity) {
      mutate("assertFact", {
        entity: memberEntity,
        attribute: "member/in-activity",
        value: ref(props.entity),
        positions: {},
      });
    }
  }, [props.entity, !!inActivity, authorized]);
  return (
    <div className="w-full flex flex-col relative items-stretch mx-auto max-w-3xl">
      <h1>{name?.value}</h1>
      <h2>In Hand</h2>
      <Hand entity={props.entity} />
      <Messages topic={props.entity} />
      <MessageInput id={props.entity} topic={props.entity} />
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
