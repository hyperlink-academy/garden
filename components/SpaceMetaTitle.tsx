import {
  ReplicacheContext,
  scanIndex,
  db,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { useSubscribe } from "replicache-react";
import { slugify } from "src/utils";

export const SpaceMetaTitle = () => {
  let rep = useContext(ReplicacheContext);
  let spaceID = useSpaceID();
  let { data } = useSpaceData(spaceID);

  let router = useRouter();
  useEffect(() => {
    if (data?.display_name)
      history.replaceState(
        null,
        "",
        `/s/${router.query.studio}/s/${router.query.space}/${slugify(
          data.display_name
        )}`
      );
  }, [data?.display_name, router]);

  let { memberEntity } = useMutations();
  let unreadCount = useSubscribe(
    rep?.rep,
    async (tx) => {
      //This is more complicated than you would think as we only want to notify
      //for cards in rooms directly, and discussions on those cards
      if (!memberEntity) return null;
      let count = 0;
      let unreadDiscussions = await scanIndex(tx).vae(
        memberEntity,
        "discussion/unread-by"
      );
      let unreadCards = await scanIndex(tx).vae(memberEntity, "card/unread-by");

      for (let card of unreadCards) {
        let inRooms = await scanIndex(tx).vae(card.entity, "desktop/contains");
        if (inRooms.length > 0) count++;
      }
      for (let discussion of unreadDiscussions) {
        let inRooms = await scanIndex(tx).vae(
          discussion.entity,
          "desktop/contains"
        );

        let isRoom = await scanIndex(tx).eav(discussion.entity, "room/name");
        if (inRooms.length > 0 || isRoom) count++;
      }

      return count;
    },
    null as number | null,
    [memberEntity]
  );

  return (
    <Head>
      <title key="title">{`${
        unreadCount && unreadCount > 0 ? `(${unreadCount})` : ""
      } ${data?.display_name}`}</title>
    </Head>
  );
};
