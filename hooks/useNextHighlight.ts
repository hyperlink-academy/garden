import { Fact } from "data/Facts";
import { useContext } from "react";
import { useSubscribe } from "replicache-react";
import { ReplicacheContext, useIndex, useMutations } from "./useReplicache";

export const useNextHighlight = () => {
  let { memberEntity } = useMutations();
  let lastRead = useIndex.eav(memberEntity, "member/last-read-highlight");
  let rep = useContext(ReplicacheContext);
  return useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!memberEntity) return null;
      let unreadHighlights = tx
        .scan({
          indexName: "at",
          start: {
            exclusive: true,
            key: [`highlight/time-${lastRead?.value.value || ""}`],
          },
        })
        .values();
      let currentHighlight = (await unreadHighlights.next()).value as
        | Fact<"highlight/time">
        | undefined;
      if (!currentHighlight) return null;
      else
        return {
          current: currentHighlight,
        };
    },
    null,
    [lastRead, memberEntity]
  );
};
