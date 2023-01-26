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
import { Rooms } from "components/Icons";
import { parentPort } from "worker_threads";

let SidebarOpenAtom = atom(false);

export default function SpacePage() {
  let spaceName = useIndex.aev("this/name")[0];
  let homeEntity = useIndex.aev("home");
  let [, setSidebarOpen] = useAtom(SidebarOpenAtom);

  let [room, setRoom] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (homeEntity[0]) setRoom(homeEntity[0].entity);
  }, [homeEntity[0]]);

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
        <meta name="theme-color" content="#0000FF" />
      </Head>

      <div className="pageWrapperflex h-screen flex-col items-stretch justify-items-center gap-2 overflow-hidden sm:gap-4">
        <div
          className={`
          pageContent 
          relative mx-auto flex 
          h-screen w-full max-w-6xl
          grow 
          items-stretch 
          py-4 px-2
          sm:py-6 sm:px-4 `}
        >
          <SpaceHeader />

          <SmallCardDragContext>
            {width > 640 ? (
              <div
                className={`
              contentLargeSplitLayout
              flex 
              w-full flex-row items-stretch gap-4 overflow-x-scroll 
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
                      onRoomChange={(room) => {
                        setRoom(room);
                        setSidebarOpen(false);
                        let roomPane = document.getElementById("roomWrapper");
                        roomPane
                          ? roomPane.scrollIntoView({ behavior: "smooth" })
                          : null;
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
                      gap-0 overflow-y-scroll
                      `}
                    >
                      {room && <Desktop entityID={room} />}
                    </div>
                  </div>

                  <CardViewer EmptyState={<EmptyState />} />
                </div>
                <MobileFooter currentRoom={room} currentCard="card" />
              </div>
            )}
          </SmallCardDragContext>
        </div>
      </div>
    </>
  );
}
const MobileFooter = (props: {
  currentRoom: string | null;
  currentCard: string;
}) => {
  let homeEntity = useIndex.aev("home");
  let roomName = useIndex.eav(props.currentRoom, "room/name");

  let [, setSidebarOpen] = useAtom(SidebarOpenAtom);

  return (
    <div className="roomFooter grid shrink-0 grid-cols-[minmax(0,auto)_auto] justify-between gap-8 font-bold text-grey-35">
      <div className=" flex w-full shrink grow flex-row gap-4">
        <button
          id="roomToggle"
          onClick={() => {
            // let room = document.getElementById("roomWrapper");
            // room ? room.scrollIntoView({ behavior: "smooth" }) : null;
            setSidebarOpen((open) => !open);
          }}
        >
          <Rooms />
        </button>
        <div
          onClick={() => {
            let roomPane = document.getElementById("roomWrapper");
            roomPane ? roomPane.scrollIntoView({ behavior: "smooth" }) : null;
            setSidebarOpen(false);
          }}
          className=" overflow-hidden whitespace-nowrap"
        >
          {props.currentRoom === homeEntity[0]?.entity
            ? "Homeroom"
            : roomName?.value}
        </div>
      </div>

      <div
        onClick={() => {
          let cardPane = document.getElementById("cardViewerWrapper");
          cardPane ? cardPane.scrollIntoView({ behavior: "smooth" }) : null;
        }}
        className="shrink grow overflow-hidden whitespace-nowrap text-right"
      >
        {props.currentCard}
      </div>
    </div>
  );
};
const MobileSidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let [open, setSidebarOpen] = useAtom(SidebarOpenAtom);
  let ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    let clickcb = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        let roomToggle = document.getElementById("roomToggle");
        if (roomToggle?.contains(e.target as Node)) return;
        setSidebarOpen(false);
      }
    };

    let keycb = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
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
      className={`roomListWrapper fixed top-0 bottom-0  z-10  ${
        open ? "left-0" : "-left-48"
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
