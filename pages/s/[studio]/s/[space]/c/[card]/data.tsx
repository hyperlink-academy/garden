import { Attribute } from "data/Attributes";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useContext } from "react";

export default function AllFactsPage() {
  let router = useRouter();
  let { authorized, mutate } = useMutations();
  let allFacts = useIndex.eav(
    router.query.card as string,
    "" as keyof Attribute
  );
  return (
    <div className="pb-4">
      <ul className="flex flex-col gap-4">
        {allFacts?.map((f) => (
          <li className="p-2 border">
            {!authorized ? null : (
              <button
                className="text-white bg-accent-red rounded-md p-2 mb-4"
                onClick={() => {
                  mutate("retractFact", { id: f.id });
                }}
              >
                retract
              </button>
            )}
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(f, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
