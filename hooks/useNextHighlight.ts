import { Fact } from "data/Facts";
import { useContext } from "react";
import { useSubscribe } from "replicache-react";
import { ReplicacheContext, scanIndex, useMutations } from "./useReplicache";

export const useNextHighlight = () => {
  let { memberEntity } = useMutations();
  let rep = useContext(ReplicacheContext);
  return useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!memberEntity) return null;
      let lastRead = await scanIndex(tx).eav(
        memberEntity,
        "member/last-read-highlight"
      );
      let unreadHighlights = tx
        .scan({
          indexName: "at",
          prefix: `highlight/time`,
          start: {
            exclusive: true,
            key: [`highlight/time-${lastRead?.value || ""}`],
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
    [memberEntity]
  );
};
