import { Desktop } from "components/Desktop";
import { CardViewer } from "components/CardViewerContext";
import { useIndex } from "hooks/useReplicache";
import { SmallCardDragContext } from "components/DragContext";
import { SpaceHeader, Sidebar } from "components/SpaceLayout";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { Popover } from "@headlessui/react";
import { atom, useAtom } from "jotai";

export default function SpacePage() {
  let spaceName = useIndex.aev("this/name")[0];
  let homeEntity = useIndex.aev("home");

  let [room, setRoom] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (homeEntity[0]) setRoom(homeEntity[0].entity);
  }, [homeEntity[0]]);

  console.log(width);

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
            {width > 640 ? (
              <div
                className={`
              contentLargeSplitLayout
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
            ) : (
              <div className="smallSplitLayout flex w-full flex-col items-stretch gap-2 pb-4">
                <div
                  className={`layoutContent flex w-full snap-x snap-mandatory flex-row items-stretch gap-4 overflow-x-scroll scroll-smooth`}
                >
                  <div
                    id="roomWrapper"
                    className="roomWrapper relative flex snap-center flex-row rounded-md border border-grey-90"
                  >
                    <MobileSidebar
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
                      gap-0 overflow-y-scroll
                      `}
                    >
                      {room && <Desktop entityID={room} />}
                    </div>
                  </div>

                  <CardViewer EmptyState={<EmptyState />} />
                </div>
                <MobileFooter />
              </div>
            )}
          </SmallCardDragContext>
        </div>
      </div>
    </>
  );
}
let SidebarOpenAtom = atom(false);
const MobileFooter = () => {
  let [, setOpen] = useAtom(SidebarOpenAtom);
  return (
    <div className="roomFooter flex shrink-0 flex-row justify-between font-bold text-grey-35">
      <div className="flex flex-row gap-2">
        <button
          id="roomToggle"
          onClick={() => {
            let room = document.getElementById("roomWrapper");
            room ? room.scrollIntoView({ behavior: "smooth" }) : null;
            setOpen((open) => !open);
          }}
        >
          rooms
        </button>
        <p>/</p>
        <div
          onClick={() => {
            let room = document.getElementById("roomWrapper");
            room ? room.scrollIntoView({ behavior: "smooth" }) : null;
            setOpen(false);
          }}
        >
          room name
        </div>
      </div>

      <div
        onClick={() => {
          let cardView = document.getElementById("cardViewerWrapper");
          cardView ? cardView.scrollIntoView({ behavior: "smooth" }) : null;
        }}
      >
        card name
      </div>
    </div>
  );
};
const MobileSidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let [open, setOpen] = useAtom(SidebarOpenAtom);
  let ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;

    let clickcb = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        let roomToggle = document.getElementById("roomToggle");
        if (e.target === roomToggle) return;
        setOpen(false);
      }
    };

    let keycb = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("click", clickcb);
    window.addEventListener("keydown", keycb);
    return () => {
      window.removeEventListener("click", clickcb);
      window.removeEventListener("keydown", keycb);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className={`roomListWrapper absolute top-0 bottom-0 z-10 ${
        open ? "left-0 " : "-left-48"
      }`}
    >
      <Sidebar {...props} />
    </div>
  );
};

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
