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
      let currentHighlight = (await unreadHighlights.next()) as {
        value: Fact<"highlight/time"> | undefined;
        done: boolean;
      };
      while (currentHighlight.value) {
        let next = (await unreadHighlights.next()) as {
          value: Fact<"highlight/time"> | undefined;
          done: boolean;
        };
        let creator = await scanIndex(tx).eav(
          currentHighlight.value.entity,
          "card/created-by"
        );
        if (creator && creator.value.value == memberEntity) {
          currentHighlight = next;
          continue;
        }
        return {
          current: currentHighlight.value,
          done: !!next.done,
        };
      }
      return null;
    },
    null,
    [memberEntity]
  );
};
