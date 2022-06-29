import { useIndex, useMutations } from "./useReplicache";

export const useInActivity = () => {
  let { memberEntity } = useMutations();
  let activity = useIndex.eav(memberEntity || null, "member/in-activity");
  return activity;
};
