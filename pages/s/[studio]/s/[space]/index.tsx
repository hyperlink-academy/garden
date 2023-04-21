import { Desktop } from "components/Desktop";
import { CardViewer } from "components/CardViewerContext";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { SmallCardDragContext } from "components/DragContext";
import { Sidebar } from "components/SpaceLayout";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { CardCollection } from "components/CardCollection";
import { useSubscribe } from "replicache-react";
import { usePreserveScroll } from "hooks/utils";
import { sortByPosition } from "src/position_helpers";
import { SearchRoom } from "components/SearchRoom";
import { CalendarRoom } from "components/CalendarRoom";
import { useUndoableState } from "hooks/useUndoableState";
import { useRouter } from "next/router";
import { slugify } from "src/utils";
import { Discussion } from "components/CardView/Discussion";
import { GoToTop } from "components/Icons";

export default function SpacePage() {
  let spaceName = useIndex.aev("space/display_name")[0];

  // get first room = your room
  // OR if viewing anon, get first room based on room id
  let { memberEntity } = useMutations();
  let firstRoomByID = useIndex
    .aev("room/name")
    .sort(sortByPosition("roomList"))[0]?.entity;
  let firstRoom = firstRoomByID;

  let spaceID = useSpaceID();
  let [r, setRoom, setRoomWithoutHistory] = useUndoableState<string | null>(
    null
  );
  useEffect(() => {
    if (!spaceID) return;
    let room = window.localStorage.getItem(`space/${spaceID}/room`);
    if (room) setRoomWithoutHistory(room);
  }, [spaceID, setRoomWithoutHistory]);
  useEffect(() => {
    if (r && spaceID) window.localStorage.setItem(`space/${spaceID}/room`, r);
  }, [r, spaceID]);

  let room = r || firstRoom;
  let roomType = useIndex.eav(room, "room/type")?.value;
  const { width } = useWindowDimensions();

  let rep = useContext(ReplicacheContext);
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

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("desktopWrapper");
      roomPane?.scrollIntoView();
    });
  }, []);
  let router = useRouter();
  useEffect(() => {
    if (spaceName)
      history.replaceState(
        null,
        "",
        `/s/${router.query.studio}/s/${router.query.space}/${slugify(
          spaceName?.value
        )}`
      );
  }, [spaceName, router]);

  return (
    <>
      <Head>
        <title key="title">{`${
          unreadCount && unreadCount > 0 ? `(${unreadCount})` : ""
        } ${spaceName?.value}`}</title>
      </Head>

      <div className="pageWrapperflex safari-pwa-height h-[100dvh] flex-col items-stretch justify-items-center gap-2 overflow-hidden sm:gap-4">
        <div className="pageContent max-w-screen-xl relative mx-auto flex h-full w-full grow items-stretch md:py-6 md:px-4">
          <SmallCardDragContext>
            {width > 960 ? (
              <div
                className="contentLargeSplitLayout no-scrollbar flex w-full flex-row items-stretch gap-4 overflow-x-scroll sm:justify-center sm:gap-4"
                // you need to add this to the contentSplitLayout class if you are going to scroll across more than 2 panes
                // it prevents the last pane from sticking to the end
                // after:content-[""] after:h-full after:w-2 after:block after:shrink-0
              >
                <div className="roomWrapper flex flex-row rounded-md border border-grey-90">
                  <Sidebar
                    onRoomChange={(room) => {
                      setRoom(room);
                    }}
                    currentRoom={room}
                  />

                  <div className="desktopWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0">
                    <Room entityID={room} key={room} />
                  </div>
                </div>

                <CardViewer
                  EmptyState={<EmptyState roomType={roomType} />}
                  room={room}
                />
              </div>
            ) : (
              <div className="no-scrollbar flex snap-x snap-mandatory flex-row gap-2 overflow-x-scroll overscroll-x-none scroll-smooth">
                <div className="snap-end snap-always">
                  <Sidebar
                    onRoomChange={(room) => {
                      setRoom(room);
                      let roomPane = document.getElementById("roomWrapper");
                      setTimeout(() => {
                        roomPane?.scrollIntoView({ behavior: "smooth" });
                      }, 10);
                    }}
                    currentRoom={room}
                  />
                </div>
                <div
                  id="roomWrapper"
                  className="roomWrapper pwa-padding relative flex snap-center snap-always flex-row py-4"
                >
                  <div
                    id="desktopWrapper"
                    className="desktopWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border border-grey-90"
                  >
                    <Room entityID={room} key={room} />
                  </div>
                </div>

                <div className="pwa-padding py-4 pr-2">
                  <CardViewer
                    EmptyState={<EmptyState roomType={roomType} />}
                    room={room}
                  />
                </div>
              </div>
            )}
          </SmallCardDragContext>
        </div>
      </div>
    </>
  );
}

const Room = (props: { entityID: string | null }) => {
  let roomType = useIndex.eav(props.entityID, "room/type");
  let roomDescription = useIndex.eav(props.entityID, "room/description");
  let roomName = useIndex.eav(props.entityID, "room/name");
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);

  const [isRoomDescriptionVisible, setIsRoomDescriptionVisible] =
    useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.id === "roomDescription") {
          setIsRoomDescriptionVisible(entry.isIntersecting);
        }
      });
    });
    let roomDescription = document.getElementById("roomDescription");
    if (!roomDescription) return;
    observer.observe(roomDescription);
    return () => {
      observer.disconnect();
    };
  }, []);

  if (props.entityID === "search") return <SearchRoom />;
  if (props.entityID === "calendar") return <CalendarRoom />;

  const handleGoToTopClick = () => {
    const scrollContainer = document.getElementById("roomScrollContainer");
    if (!scrollContainer) return;
    const initialPosition = scrollContainer.scrollTop;
    const step = (timestamp: number) => {
      const progress = (timestamp - startTime) / duration;
      const scrollTop = initialPosition * (1 - progress);
      scrollContainer.scrollTop = scrollTop;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    const duration = 300; // milliseconds
    const startTime = performance.now();
    window.requestAnimationFrame(step);
  };

  return (
    <div
      id="roomScrollContainer"
      ref={ref}
      className="no-scrollbar m-2 flex h-full w-[336px] flex-col gap-2 overflow-x-hidden overflow-y-scroll text-sm sm:m-4"
    >
      {/* Room Name and Description */}
      <div className="sticky top-0 z-20 flex justify-between bg-background text-lg font-bold text-grey-35">
        <p className="mb-2">{roomName?.value}</p>
        {!isRoomDescriptionVisible && (
          <button onClick={handleGoToTopClick}>
            <GoToTop />
          </button>
        )}
      </div>
      <div id="roomDescription" className="-mt-2">
        <p className="text-sm text-grey-35">{roomDescription?.value}</p>
      </div>
      <hr className="sticky top-9 z-20 mb-1 text-grey-80" />

      {/* per-room wrappers + components */}
      {props.entityID ? (
        roomType?.value === "collection" ? (
          <div className="flex min-h-[calc(100vh-132px)] flex-col gap-2">
            <CardCollection
              filterable
              entityID={props.entityID}
              attribute="desktop/contains"
            />
          </div>
        ) : roomType?.value === "chat" ? (
          <div className="flex h-full flex-col">
            <Discussion entityID={props.entityID} isRoom={true} />
          </div>
        ) : (
          <div className="relative flex flex-col">
            <Desktop entityID={props.entityID} />
            <div className="desktopBackground absolute h-full w-full" />
          </div>
        )
      ) : null}
    </div>
  );
};

const EmptyState = (props: { roomType?: string | undefined }) => {
  return (
    <div className="no-scrollbar relative flex h-full w-full max-w-3xl snap-y snap-mandatory snap-start flex-col gap-6 overflow-y-scroll rounded-lg border border-dashed border-grey-80 p-4 text-grey-35">
      <div className="m-auto flex flex-col gap-4 text-center">
        {props.roomType === "canvas" ? (
          <>
            <p>
              <em>Double-click canvas to add a card</em>
            </p>
            <p>
              <em>Drag a card to move it</em>
            </p>
          </>
        ) : props.roomType === "collection" ? (
          <>
            <p>
              <em>Click a card to open it here</em>
            </p>
            <p>
              <em>Drag cards to reorder</em>
            </p>
          </>
        ) : (
          // if not 'canvas' or 'collection', it's chat
          <>
            <p>
              <em>Attach cards to chat messages</em>
            </p>
            <p>
              <em>Click to open them here</em>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
