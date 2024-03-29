import { Fact } from "data/Facts";
import { db, useMutations } from "hooks/useReplicache";
import { useEffect, useMemo, useState } from "react";
import { CardPreviewWithData } from "./CardPreview";
import { Divider } from "./Layout";
import { CollectionListTiny, CollectionPreviewTiny, GoToTop } from "./Icons";

export const UnreadsRoom = () => {
  let { memberEntity, permissions } = useMutations();
  let authorized = permissions.commentAndReact;
  let unreadCards = db.useReference(memberEntity, "card/unread-by");
  let rooms = db.useAttribute("room/type");
  let chatRooms = useMemo(() => {
    return rooms.filter((room) => room.value === "chat");
  }, [rooms]);
  let unreadDiscussions = db.useReference(memberEntity, "discussion/unread-by");
  let [scrolledTop, setScrolledTop] = useState(true);
  let [listType, setListType] = useState<"cardpreview" | "list">("list");
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
      return newUnreads.filter(
        (unread) => !chatRooms.find((room) => room.entity === unread.entity)
      );
    });
  }, [unreadCards, chatRooms]);

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

  useEffect(() => {
    let roomWrapper = document.getElementById("unread-room-wrapper");
    const onScroll = (event: Event) => {
      if (roomWrapper?.scrollTop === 0) {
        setScrolledTop(true);
      } else {
        setScrolledTop(false);
      }
    };

    roomWrapper?.addEventListener("scroll", onScroll);
    return () => {
      roomWrapper?.removeEventListener("scroll", onScroll);
    };
  }, []);

  const className = (typeName: "list" | "cardpreview") =>
    `p-0.5 text-grey-55 ${
      typeName === listType
        ? "rounded-md border border-grey-55"
        : "border border-transparent"
    }`;

  return (
    <div
      id="unread-room-wrapper"
      className="no-scrollbar mx-2 mb-2 mt-0 flex h-full w-[302px] flex-col  items-stretch  overflow-x-hidden overflow-y-scroll text-sm sm:m-4 sm:mt-0  "
    >
      {!authorized ? (
        "You have to be a member of this space to have unreads"
      ) : (
        <div className="flex flex-col gap-2">
          {/* HEY START SOME SHIT */}

          <>
            <div className="roomHeader bg-background sticky top-0 z-20 flex flex-col gap-1 pt-2 sm:-mx-4 sm:px-4 sm:pt-3">
              <div className="roomTitle flex justify-between">
                <button
                  className={`text-grey-35 mb-1 text-lg font-bold `}
                  onClick={() =>
                    document.getElementById("unread-room-wrapper")?.scrollTo({
                      top: 0,
                      left: 0,
                      behavior: "smooth",
                    })
                  }
                >
                  Unreads
                  <span className="text-grey-35 text-sm">
                    ({unreadCards.length + unreadDiscussions.length})
                  </span>
                </button>
                {authorized && (
                  <div className="roomOptionsWrapper mt-[4px] ">
                    {!scrolledTop && (
                      <button
                        onClick={() =>
                          document
                            .getElementById("unread-room-wrapper")
                            ?.scrollTo({
                              top: 0,
                              left: 0,
                              behavior: "smooth",
                            })
                        }
                      >
                        <GoToTop />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="collectionTypeSelector mb-2 flex flex-row items-center gap-1">
                <button
                  className={`${className("list")} shrink-0`}
                  onClick={() => {
                    setListType("list");
                  }}
                >
                  <CollectionListTiny />
                </button>
                <button
                  className={`${className("cardpreview")} shrink-0`}
                  onClick={() => {
                    setListType("cardpreview");
                  }}
                >
                  <CollectionPreviewTiny />
                </button>
              </div>
              <Divider />
            </div>
          </>
          {cachedUnreads.length === 0 ? (
            <div className="text-grey-55 italic">
              <p className="pb-2 font-bold">
                You have no unreads! <br />
              </p>
              New cards and comments you haven&apos;t yet seen will appear here
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3">
              {cachedUnreads
                .filter(
                  (unread) =>
                    !chatRooms.find((room) => room.entity === unread.entity)
                )
                .sort((a, b) => {
                  if (a.lastUpdated > b.lastUpdated) return -1;
                  return 0;
                })
                .map((unread) => (
                  <CardPreviewWithData
                    hideContent={listType === "list"}
                    key={unread.id}
                    entityID={unread.entity}
                    size="big"
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
