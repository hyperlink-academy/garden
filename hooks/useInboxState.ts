import { useContext } from "react";
import { useSubscribe } from "replicache-react";
import { ReplicacheContext, scanIndex, useMutations } from "./useReplicache";

export const useInboxState = () => {
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
      let inbox = await scanIndex(tx).eav(memberEntity, "member/inbox");
      return (
        inbox.filter((f) => !lastRead || f.lastUpdated > lastRead.value)
          .length > 0
      );
    },
    null,
    [memberEntity]
  );
};
