import { useContext } from "react";
import { useSubscribe } from "replicache-react";
import { ReplicacheContext, scanIndex, useMutations } from "./useReplicache";

export const useReactions = (entityID?: string | null) => {
  let { memberEntity } = useMutations();
  let rep = useContext(ReplicacheContext);

  let reactions = useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!entityID) return [];
      let reactions = await scanIndex(tx).eav(entityID, "card/reaction");
      let data: {
        [reaction: string]: { count: number; memberReaction: string | null };
      } = {};
      for (let reaction of reactions) {
        let r = data[reaction.value] || { count: 0, memberReaction: null };
        if (memberEntity) {
          let author = await scanIndex(tx).eav(reaction.id, "reaction/author");
          if (author?.value.value === memberEntity)
            r.memberReaction = reaction.id;
        }
        r.count++;
        data[reaction.value] = r;
      }
      return Object.entries(data);
    },
    [],
    [entityID, memberEntity]
  );
  return reactions;
};
