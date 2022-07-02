import { Divider } from "components/Layout";
import { SmallCardList } from "components/SmallCardList";
import { ref } from "data/Facts";
import { useInActivity } from "hooks/useInActivity";
import { useIndex, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import router, { useRouter } from "next/router";
import { useEffect } from "react";
import { MessageInput, Messages } from "../chat";

export default function ActivityPage() {
  let { query } = useRouter();
  return <Activity entity={query.activity as string} />;
}

export const Activity = (props: { entity: string }) => {
  let name = useIndex.eav(props.entity, "activity/name");
  let { mutate, authorized, memberEntity } = useMutations();
  let { query } = useRouter();

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
    <div className="h-full flex flex-col gap-4 max-w-3xl mx-auto pb-6">
      <div className="pt-4 grid grid-cols-[auto_max-content] gap-4">
        <h2>{name?.value}</h2>
        <Link href={`/s/${query.studio}/s/${query.space}/activity`}>
          <a className="text-right text-accent-red pt-0.5">Exit</a>
        </Link>
      </div>
      <div>
        <h4>Cards In Hand</h4>
        <Hand entity={props.entity} />
        <Divider />
      </div>
      <Messages topic={props.entity} />
      <MessageInput id={props.entity} topic={props.entity} />
    </div>
  );
};

const Hand = (props: { entity: string }) => {
  let cards = useIndex.eav(props.entity, "activity/hand-contains");
  return (
    <div className="overflow-x-auto p-4 w-full">
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
