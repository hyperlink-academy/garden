import { useReactions } from "./useReactions";
import { useIndex } from "./useReplicache";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export type CardPreviewData = ReturnType<typeof useCardPreviewData>;
export const useCardPreviewData = (entityID: string) => {
  let isMember = !!useIndex.eav(entityID, "member/name");

  let reactions = useReactions(entityID);
  let member = useIndex.eav(entityID, "member/name");
  let title = useIndex.eav(entityID, "card/title");
  let content = useIndex.eav(entityID, "card/content");
  let image = useIndex.eav(entityID, "card/image");
  let date = useIndex.eav(entityID, "card/date");

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return {
    reactions,
    title,
    content,
    imageUrl,
    isMember,
    member: member,
    date,
  };
};
