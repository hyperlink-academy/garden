import { Fact } from "data/Facts";
import { db, useMutations } from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { CardPreviewWithData } from "./CardPreview";
import { RoomWrapper } from "./RoomLayout";

export const UnreadsRoom = () => {
  let { authorized, memberEntity } = useMutations();
  let unreadCards = db.useReference(memberEntity, "card/unread-by");
  let unreadDiscussions = db.useReference(memberEntity, "discussion/unread-by");
  let [cachedUnreads, setCachedUnreads] = useState<
    Fact<"card/unread-by" | "discussion/unread-by">[]
  >([]);
  useEffect(() => {
    setCachedUnreads((existingUnreads) => {
      let newUnreads = [...existingUnreads];
      for (let unread of unreadCards) {
        if (!newUnreads.find((u) => u.entity === unread.entity))
          newUnreads.push(unread);
      }
      return newUnreads;
    });
  }, [unreadCards]);

  useEffect(() => {
    setCachedUnreads((existingUnreads) => {
      let newUnreads = [...existingUnreads];
      for (let unread of unreadDiscussions) {
        if (!newUnreads.find((u) => u.entity === unread.entity))
          newUnreads.push(unread);
      }
      return newUnreads;
    });
  }, [unreadDiscussions]);
  return (
    <RoomWrapper>
      {!authorized ? (
        "You have to be a member of this space to have unreads"
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="text-grey-35">Unreads</h3>
          {cachedUnreads.length === 0 ? (
            <span className="italic text-grey-55">
              Cards others make that you haven&apos;t yet seen will appear here
            </span>
          ) : (
            cachedUnreads
              .sort((a, b) => {
                if (a.lastUpdated > b.lastUpdated) return -1;
                return 0;
              })
              .map((unread) => (
                <CardPreviewWithData
                  hideContent
                  key={unread.id}
                  entityID={unread.entity}
                  size="big"
                />
              ))
          )}
        </div>
      )}
    </RoomWrapper>
  );
};
