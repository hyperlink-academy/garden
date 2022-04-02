import { spaceAPI } from "backend/lib/api";
import { z } from "zod";
import { pullRoute } from "backend/SpaceDurableObject/routes/pull";
import {
  FactWithIndexes,
  makeReplicache,
  ReplicacheContext,
} from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { PullRequest } from "replicache";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const SpaceProvider: React.FC<{ id: string }> = (props) => {
  let [rep, setRep] = useState<ReturnType<typeof makeReplicache>>();
  useEffect(() => {
    let rep = makeReplicache({
      name: `space-${props.id}`,
      pusher: async (_request) => {
        return { httpStatusCode: 200, errorMessage: "" };
      },
      puller: async (request) => {
        let data: PullRequest = await request.json();
        let result = await spaceAPI(
          `${WORKER_URL}/space/${props.id}`,
          "pull",
          data as z.infer<typeof pullRoute.input>
        );
        let ops = result.data.map((fact) => {
          if (fact.retracted)
            return {
              op: "del",
              key: fact.id,
            } as const;
          return {
            op: "put",
            key: fact.id,
            value: FactWithIndexes(fact),
          } as const;
        });
        return {
          httpRequestInfo: { httpStatusCode: 200, errorMessage: "" },
          response: {
            lastMutationID: result.lastMutationID,
            cookie: result.cookie,
            patch: ops,
          },
        };
      },
    });
    setRep(rep);
    return () => {
      rep.close();
    };
  }, [props.id]);
  return (
    <ReplicacheContext.Provider value={rep ? { rep } : null}>
      {props.children}
    </ReplicacheContext.Provider>
  );
};
