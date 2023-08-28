import { useReactions } from "./useReactions";
import { db } from "./useReplicache";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export type CardPreviewData = ReturnType<typeof useCardPreviewData>;
export const useCardPreviewData = (entityID: string) => {
  let isMember = !!db.useEntity(entityID, "member/name");

  let reactions = useReactions(entityID);
  let member = db.useEntity(entityID, "member/name");
  let title = db.useEntity(entityID, "card/title");
  let content = db.useEntity(entityID, "card/content");
  let image = db.useEntity(entityID, "card/image");
  let date = db.useEntity(entityID, "card/date");

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
