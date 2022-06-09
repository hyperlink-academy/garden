import { Checkmark, RightArrow } from "components/Icons";
import { flag } from "data/Facts";
import { useIndex, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ActivityIndex() {
  let activeActivities = useIndex.aev("activity/active");
  let allActivities = useIndex
    .aev("activity/name")
    .filter((f) => !activeActivities.find((f2) => f2.entity === f.entity));
  return (
    <div className="flex flex-col gap-4">
      <h1>Activities</h1>
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-4">
          <h4>Active</h4>
          <div className="flex flex-col gap-2">
            {activeActivities.map((a) => (
              <ActivityItem entity={a.entity} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h4>Completed</h4>
          <div className="flex flex-col gap-2">
            {allActivities.map((a) => (
              <ActivityItem entity={a.entity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ActivityItem = (props: { entity: string }) => {
  let title = useIndex.eav(props.entity, "activity/name");
  let isActive = useIndex.eav(props.entity, "activity/active");
  let { mutate, authorized } = useMutations();
  let { query: q } = useRouter();
  return (
    <div className="flex flex-row gap-4 items-center bg-white">
      {!authorized ? null : (
        <button
          className={`rounded-md w-4 h-4 content-center pl-0.5 ${
            !isActive ? "text-grey-55 border-2" : "border"
          }`}
          onClick={async () => {
            if (isActive)
              await mutate("retractFact", {
                id: isActive.id,
              });
            else {
              await mutate("assertFact", {
                entity: props.entity,
                value: flag(),
                attribute: "activity/active",
                positions: {},
              });
            }
          }}
        >
          {!isActive ? <Checkmark width={8} height={8} /> : null}
        </button>
      )}
      <div className="w-full bg-white py-2 px-3 rounded-md border border-grey-55 grid grid-flow-col">
        <span
          className={`font-bold ${
            isActive ? "text-accent-blue" : "text-grey-55"
          }`}
        >
          {title?.value}
        </span>
        <Link href={`/s/${q.studio}/s/${q.space}/activity/${props.entity}`}>
          <a
            className={`justify-self-end ${
              isActive ? "text-accent-blue" : "text-grey-15"
            }`}
          >
            <RightArrow />
          </a>
        </Link>
      </div>
    </div>
  );
};
