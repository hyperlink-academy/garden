import type { Replicache } from "replicache";
import type { ReadonlyJSONValue, ReadTransaction } from "replicache";
import { startTransition, useEffect } from "react";
import useSWRImmutable from "swr/immutable";
import useSWR from "swr";

// We wrap all the callbacks in a `unstable_batchedUpdates` call to ensure that
// we do not render things more than once over all of the changed subscriptions.

export function useSubscribe<R extends ReadonlyJSONValue>(
  rep: Replicache | null | undefined,
  query: (tx: ReadTransaction) => Promise<R>,
  def: R,
  deps: Array<unknown> = [],
  key: string
): R {
  let { data, mutate } = useSWRImmutable(
    rep ? key + rep.name : null,
    () => {
      if (!rep) {
        return;
      }
      return rep.query(query);
    },
    { suspense: true }
  );
  useEffect(() => {
    if (!rep) {
      return;
    }

    return rep.subscribe(query, {
      onData: (data: R) => {
        startTransition(() => {
          mutate(data);
        });
      },
    });
  }, [rep, ...deps]);
  return data || def;
}
