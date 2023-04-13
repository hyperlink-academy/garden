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
import { useContext, useEffect } from "react";
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
        let cards = await scanIndex(tx).vae(
          discussion.entity,
          "card/discussion"
        );
        for (let card of cards) {
          let inRooms = await scanIndex(tx).vae(
            card.entity,
            "desktop/contains"
          );
          if (inRooms.length > 0) count++;
        }
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
        <div
          className={`
          pageContent 
          max-w-screen-xl relative mx-auto 
          flex
         h-full w-full
          grow 
          items-stretch 
          md:py-6 md:px-4 `}
        >
          <SmallCardDragContext>
            {width > 960 ? (
              <div
                className={`
              contentLargeSplitLayout
              no-scrollbar 
              flex w-full flex-row items-stretch gap-4 
              overflow-x-scroll
              sm:justify-center
              sm:gap-4 
`}
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

                  <div
                    className={`
                    desktopWrapper no-scrollbar
                  relative flex 
                  h-full 
                  flex-shrink-0 
                  flex-col
                  gap-0
                  `}
                  >
                    <Room entityID={room} />
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
                    className={`
                      desktopWrapper no-scrollbar relative  flex
                      h-full
                      flex-shrink-0 flex-col 
                      gap-0 
                      rounded-md
                      border border-grey-90
                      `}
                  >
                    <Room entityID={room} />
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
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);
  if (props.entityID === "search") return <SearchRoom />;
  if (props.entityID === "calendar") return <CalendarRoom />;
  return (
    <div
      key={props.entityID}
      id="roomScrollContainer"
      ref={ref}
      className="no-scrollbar h-full overflow-x-hidden overflow-y-scroll"
    >
      <div className="relative m-2 flex w-[336px] flex-col items-stretch gap-0 text-sm sm:m-4 sm:mb-0">
        {/* remove desktop bg for collections (member rooms still canvas for now) */}
        {roomType?.value === "canvas" ? (
          <div className="desktopBackground absolute h-full w-full" />
        ) : null}
        {props.entityID ? (
          roomType?.value === "collection" ? (
            <div className="flex min-h-[calc(100vh-132px)] flex-col gap-2">
              <CardCollection
                entityID={props.entityID}
                attribute="desktop/contains"
              />
            </div>
          ) : roomType?.value === "chat" ? (
            <Discussion entityID={props.entityID} />
          ) : (
            <Desktop entityID={props.entityID} />
          )
        ) : null}
      </div>
    </div>
  );
};

const EmptyState = (props: { roomType?: string | undefined }) => {
  return (
    <div
      className={`
                no-scrollbar relative
                flex
                h-full       
                w-full
                max-w-3xl
                snap-y snap-mandatory snap-start
                flex-col gap-6 overflow-y-scroll rounded-lg
                border
                border-dashed border-grey-80 p-4
                text-grey-35
                `}
    >
      <div className="m-auto text-center">
        {props.roomType === "canvas" ? (
          <>
            <p>
              <em>Double-click canvas to add a card</em>
            </p>
            <p>
              <em>Drag a card to move it</em>
            </p>
          </>
        ) : (
          // if not 'canvas' we can assume room type is 'collection'
          <>
            <p>
              <em>Click a card to open it here</em>
            </p>
            <p>
              <em>Drag cards to reorder</em>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
