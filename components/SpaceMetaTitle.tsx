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
    if (
      data?.display_name &&
      !window.location.href.includes(slugify(data.display_name))
    ) {
      let url = new URL(window.location.href);
      url.pathname = `/s/${router.query.studio}/s/${
        router.query.space
      }/${slugify(data.display_name)}`;
      history.replaceState(null, "", url);
    }
  }, [data?.display_name, router]);

  let { memberEntity } = useMutations();
  // NB: we want unreadCount to reflect all unreads - same as in UnreadsRoom
  let unreadCount = useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!memberEntity) return null;
      let unreadCards = await scanIndex(tx).vae(memberEntity, "card/unread-by");
      let unreadDiscussions = await scanIndex(tx).vae(
        memberEntity,
        "discussion/unread-by"
      );
      let count = unreadCards?.length + unreadDiscussions?.length;
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
