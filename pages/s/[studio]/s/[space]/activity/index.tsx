import { ButtonPrimary } from "components/Buttons";
import { AddActivityBlocks, Checkmark, RightArrow } from "components/Icons";
import { Textarea } from "components/Textarea";
import { flag } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useInActivity } from "hooks/useInActivity";
import { useIndex, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { ulid } from "src/ulid";

export default function ActivityIndex() {
  let activeActivities = useIndex.aev("activity/active");
  let { mutate, authorized } = useMutations();
  let inActivity = useInActivity();

  useEffect(() => {
    if (authorized && inActivity) {
      console.log("why");
      mutate("retractFact", { id: inActivity.id });
    }
  }, [authorized, inActivity]);

  let allActivities = useIndex
    .aev("activity/name")
    .filter((f) => !activeActivities.find((f2) => f2.entity === f.entity))
    .sort((a, b) => (a.id > b.id ? -1 : 1));
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <h1>Activities</h1>
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-4">
          <h4>Active</h4>
          <div className="flex flex-col gap-2">
            {activeActivities.length === 0 ? (
              <div className="bg-grey-90 rounded-md italic p-2 text-grey-35">
                Get started by creating an activity
              </div>
            ) : (
              activeActivities.map((a) => <ActivityItem entity={a.entity} />)
            )}
          </div>
          <AddActivity />
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

const AddActivity = () => {
  let { mutate, authorized } = useMutations();

  if (!authorized) return null;
  return (
    <ButtonPrimary
      content="New Activity"
      icon={<AddActivityBlocks />}
      onClick={() => {
        let newEntity = ulid();
        mutate("assertFact", [
          {
            entity: newEntity,
            attribute: "activity/name",
            value: "",
            positions: {},
          },
          {
            entity: newEntity,
            attribute: "activity/active",
            value: flag(),
            positions: {},
          },
        ]);
      }}
    />
  );
};

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
      <div className="w-full bg-white py-2 px-3 rounded-md border border-grey-55 flex flex-row">
        {!authorized ? (
          <span
            className={`font-bold w-full ${
              isActive ? "text-accent-blue" : "text-grey-55"
            }`}
          >
            {title?.value}
          </span>
        ) : (
          <Textarea
            className={`font-bold w-full ${
              isActive ? "text-accent-blue" : "text-grey-55"
            }`}
            value={title?.value}
            placeholder="untitled activity"
            onChange={(e) => {
              mutate("assertFact", {
                entity: props.entity,
                attribute: "activity/name",
                value: e.currentTarget.value,
                positions: {},
              });
            }}
          />
        )}
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
