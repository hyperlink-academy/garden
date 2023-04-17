import type { Replicache } from "replicache";
import type { ReadonlyJSONValue, ReadTransaction } from "replicache";
import { useContext, useEffect } from "react";
import useSWRImmutable from "swr/immutable";
import { atom } from "jotai";
import { ReplicacheContext } from "./useReplicache";

// We wrap all the callbacks in a `unstable_batchedUpdates` call to ensure that
// we do not render things more than once over all of the changed subscriptions.
//
//
let hasPendingCallback = false;
let callbacks: (() => void)[] = [];

function doCallback() {
  const cbs = callbacks;
  callbacks = [];
  hasPendingCallback = false;
  for (const callback of cbs) {
    callback();
  }
}

export let suspenseAtom = atom(true);

export function useSubscribe<R extends ReadonlyJSONValue>(
  query: (tx: ReadTransaction) => Promise<R>,
  def: R,
  deps: Array<unknown> = [],
  key: string
): R {
  let rep = useContext(ReplicacheContext)?.rep;
  let { data, mutate } = useSWRImmutable(
    rep ? key + rep.name : null,
    () => {
      if (!rep) {
        return;
      }
      return rep.query(query);
    },
    {}
  );
  useEffect(() => {
    if (!rep) {
      return;
    }

    return rep.subscribe(query, {
      onData: (data: R) => {
        callbacks.push(() => mutate(data));
        if (!hasPendingCallback) {
          void Promise.resolve().then(doCallback);
          hasPendingCallback = true;
        }
      },
    });
  }, [rep, ...deps]);
  return data || def;
}
