import { Desktop } from "components/Desktop";
import { CardViewer } from "components/CardViewerContext";
import { useIndex } from "hooks/useReplicache";
import { SmallCardDragContext } from "components/DragContext";
import { SpaceHeader, Sidebar } from "components/SpaceLayout";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function SpacePage() {
  let spaceName = useIndex.aev("this/name")[0];
  let homeEntity = useIndex.aev("home");
  let [room, setRoom] = useState<string | null>(null);

  useEffect(() => {
    if (homeEntity[0]) setRoom(homeEntity[0].entity);
  }, [homeEntity[0]]);

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
        <meta name="theme-color" content="#0000FF" />
      </Head>

      <div className="pageWrapper flex h-screen flex-col items-stretch justify-items-center gap-2 overflow-hidden sm:gap-4">
        <SpaceHeader />

        <div
          className={`
          pageContent 
          relative mx-auto flex 
          h-[calc(100vh-80px)] w-full max-w-6xl
          grow 
          items-stretch 
          px-2 sm:px-4 `}
        >
          <SmallCardDragContext>
            <div
              className={`
        contentSplitLayout
        flex 
        w-full flex-row items-stretch gap-4 overflow-x-scroll 
        pb-4
        sm:justify-center
        sm:gap-4 sm:pb-8
`}
              // you need to add this to the contentSplitLayout class if you are going to scroll across more than 2 panes
              // it prevents the last pane from sticking to the end
              // after:content-[""] after:h-full after:w-2 after:block after:shrink-0
            >
              <div className="roomWrapper flex flex-row rounded-md border border-grey-90">
                <Sidebar
                  onRoomChange={(room) => setRoom(room)}
                  currentRoom={room}
                />
                <div
                  className={`
          desktopWrapper
          no-scrollbar flex 
          h-full 
          flex-shrink-0 
         flex-col
          gap-0 overflow-x-hidden overflow-y-scroll
          `}
                >
                  {room && <Desktop entityID={room} />}
                </div>
              </div>
              <CardViewer EmptyState={<EmptyState />} />
            </div>
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
      <p className="m-auto">
        <em>Open a card!</em>
      </p>
    </div>
  );
};
