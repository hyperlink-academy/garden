import { useIndex, useMutations } from "./useReplicache";

export const useReadState = (entity: string) => {
  let { memberEntity } = useMutations();
  // A highlight is an entity. For every person who has read it we want to store
  // a ref fact,
  let latest = useIndex.eav(entity, "chat/last-message");
  let readStates = useIndex.eav(
    latest ? memberEntity : null,
    "last-read-message"
  );
  let read = readStates?.find((f) => f.value.chat === entity);
  return !read || !latest || read.value.message === latest.value;
};
