import { useSubscribe as useSubscribeRepl } from "replicache-react";
import type { ReadonlyJSONValue, ReadTransaction } from "replicache";
import { useContext } from "react";
import { ReplicacheContext } from "./useReplicache";

export function useSubscribe<R extends ReadonlyJSONValue>(
  query: (tx: ReadTransaction) => Promise<R>,
  defaultVal: R,
  dependencies: Array<unknown> = [],
  _key?: string
): R {
  let rep = useContext(ReplicacheContext)?.rep;
  return useSubscribeRepl(rep, query, {
    default: defaultVal,
    dependencies,
  });
}
