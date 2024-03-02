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
        [reaction: string]: {
          count: number;
          memberReaction: string | null;
          members: string[];
        };
      } = {};
      for (let reaction of reactions) {
        let r = data[reaction.value] || {
          count: 0,
          memberReaction: null,
          members: [],
        };
        if (memberEntity) {
          let author = await scanIndex(tx).eav(reaction.id, "reaction/author");
          let authorName = author
            ? await scanIndex(tx).eav(author?.value.value, "member/name")
            : null;
          if (authorName) r.members.push(authorName.value);
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
