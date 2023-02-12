import { Desktop } from "components/Desktop";
import { CardViewer } from "components/CardViewerContext";
import { useIndex, useMutations } from "hooks/useReplicache";
import { SmallCardDragContext } from "components/DragContext";
import { SpaceHeader, Sidebar } from "components/SpaceLayout";
import Head from "next/head";
import { useEffect, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { Popover } from "@headlessui/react";
import { Rooms } from "components/Icons";

export default function SpacePage() {
  let spaceName = useIndex.aev("this/name")[0];

  // get first room = your room
  // OR if viewing anon, get first room based on room id
  let { memberEntity } = useMutations();
  let firstRoomByID = useIndex
    .aev("room/name")
    .sort((a, b) => (a.id > b.id ? 1 : -1))[0]?.entity;
  let firstRoom = memberEntity ? memberEntity : firstRoomByID;

  let [room, setRoom] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (firstRoom) setRoom(firstRoom);
  }, [firstRoom]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("desktopWrapper");
      console.log(roomPane);
      roomPane?.scrollIntoView();
    });
  }, []);

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>

      <div className="pageWrapperflex safari-pwa-height h-[100dvh] flex-col items-stretch justify-items-center gap-2 overflow-hidden sm:gap-4">
        <div
          className={`
          pageContent 
          relative mx-auto flex 
          h-full
         w-full max-w-6xl
          grow 
          items-stretch 
          sm:py-6 sm:px-4 `}
        >
          <SpaceHeader />

          <SmallCardDragContext>
            {width > 640 ? (
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
                    desktopWrapper
                  no-scrollbar flex 
                  h-full 
                  flex-shrink-0 
                  flex-col
                  gap-0
                  `}
                  >
                    <div className="no-scrollbar overflow-x-hidden overflow-y-scroll sm:p-4">
                      <div className="relative flex w-[336px] flex-col items-stretch gap-0">
                        <div className="desktopBackground absolute h-full w-full" />
                        {room && <Desktop entityID={room} />}
                      </div>
                    </div>
                  </div>
                </div>

                <CardViewer EmptyState={<EmptyState />} room={room} />
              </div>
            ) : (
              <div className="no-scrollbar flex snap-x snap-mandatory flex-row gap-2 overflow-x-scroll overscroll-x-none">
                <div className="snap-end snap-always">
                  <Sidebar
                    onRoomChange={(room) => {
                      setRoom(room);
                      let roomPane = document.getElementById("roomWrapper");
                      roomPane
                        ? roomPane.scrollIntoView({ behavior: "smooth" })
                        : null;
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
                      desktopWrapper no-scrollbar flex 
                      h-full
                      flex-shrink-0 flex-col 
                      gap-0 
                      rounded-md
                      border border-grey-90
                      `}
                  >
                    <div className="no-scrollbar  overflow-x-hidden overflow-y-scroll sm:p-4">
                      <div className="relative flex w-[336px] flex-col items-stretch gap-0">
                        <div className="desktopBackground absolute h-full w-full" />
                        {room && <Desktop entityID={room} />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pwa-padding py-4 pr-2">
                  <CardViewer EmptyState={<EmptyState />} room={room} />
                </div>
              </div>
            )}
          </SmallCardDragContext>
        </div>
      </div>
    </>
  );
}

const EmptyState = () => {
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
        <p>
          <em>Double-click canvas to add a card</em>
        </p>
        <p>
          <em>Drag a card to move it</em>
        </p>
      </div>
    </div>
  );
};
