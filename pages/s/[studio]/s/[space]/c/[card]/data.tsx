import { Attribute } from "data/Attributes";
import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useContext } from "react";

export default function AllFactsPage() {
  let router = useRouter();
  let rep = useContext(ReplicacheContext);
  let allFacts = useIndex.eav(
    router.query.card as string,
    "" as keyof Attribute
  );
  return (
    <div className="pb-4">
      <ul className="flex flex-col gap-4">
        {allFacts?.map((f) => (
          <li className="p-2 border">
            <button
              className="bg-accent-red rounded-md p-2"
              onClick={() => {
                rep?.rep.mutate.retractFact({ id: f.id });
              }}
            >
              {" "}
              retract{" "}
            </button>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(f, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
