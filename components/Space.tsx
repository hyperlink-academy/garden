"use client";
import { CardViewer } from "components/CardViewerContext";
import { SmallCardDragContext, useDroppableZone } from "components/DragContext";
import { Sidebar } from "components/SpaceLayout";
import { useEffect, useRef, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { Room } from "components/Room";
import { SpaceMetaTitle } from "components/SpaceMetaTitle";
import { useUIState } from "hooks/useUIState";
import { PresenceHandler } from "components/PresenceHandler";
import { useSpaceSyncState } from "hooks/useSpaceSyncState";
import { springConfig } from "src/constants";
import { useViewportSize } from "hooks/useViewportSize";
import { Question, SidebarIcon } from "components/Icons";
import { SpaceName, SpaceOptions } from "components/SpaceLayout/Sidebar";
import { useSpring, animated } from "@react-spring/web";
import { createPortal } from "react-dom";
import { useAuth } from "hooks/useAuth";
import { ButtonPrimary } from "components/Buttons";
import { LoginOrSignupModal } from "components/LoginModal";
import Link from "next/link";
import { Search, MobileSearch } from "components/Search";
import { HelpModal } from "components/HelpCenter";
import { useGesture } from "@use-gesture/react";
import { useDndContext } from "@dnd-kit/core";
import { useSpaceShortcuts } from "hooks/useSpaceShortcuts";
import { SpaceData } from "components/SpacesList";
import { SpaceViewerHeader } from "app/studio/[studio_id]/space/SpaceViewerHeader";
import { useIsClient } from "hooks/utils";

type Props = {
  studio?: { spaces: SpaceData[]; studioName: string; studioID: string };
};

export const Space = (props: Props) => {
  let isClient = useIsClient();
  const { width } = useWindowDimensions();
  useSpaceSyncState();
  useSpaceShortcuts();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("roomInnerWrapper");
      roomPane?.scrollIntoView();
    });
  }, []);

  if (!isClient) return null;
  return (
    <>
      <SpaceMetaTitle />
      <PresenceHandler />
      <SmallCardDragContext>
        {width > 640 || width === 0 ? (
          <DesktopLayout {...props} />
        ) : (
          <MobileLayout {...props} />
        )}
      </SmallCardDragContext>
    </>
  );
};

const DesktopLayout = (props: Props) => {
  let { session } = useAuth();

  return (
    <div className="mx-auto flex h-full w-full flex-col gap-2 overflow-hidden">
      <div className="spaceHeader mx-auto flex w-full max-w-[1332px] flex-row items-end justify-between gap-4 px-2">
        {props.studio ? <SpaceViewerHeader {...props.studio} /> : <Header />}
        <div className="spaceHeaderSearch flex w-[440px] shrink-0 flex-row items-center gap-2 text-grey-55">
          <HelpButton />

          {!session.loggedIn ? <LoginButton /> : <SpaceOptions />}

          <Search />
        </div>
      </div>
      <div className=" no-scrollbar spaceLargeSplitLayout mx-auto flex h-full w-full max-w-[1332px] snap-x snap-mandatory flex-row items-stretch gap-4 overflow-y-hidden overflow-x-scroll scroll-smooth px-4 sm:gap-4  md:overflow-x-hidden">
        <div className="spaceRoomAndSidebar flex shrink-0  snap-center snap-always flex-row  rounded-md border border-grey-90">
          <div className="shrink-0 rounded-l-md border border-transparent border-r-grey-90 bg-white">
            <Sidebar />
          </div>

          <div className="spaceRoomWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0">
            <Room />
          </div>
        </div>

        <CardViewer />
      </div>
    </div>
  );
};

const Header = () => {
  let { session } = useAuth();
  return (
    <div className="spaceHeaderInfo group group -mb-1 ml-2 flex min-w-0 shrink grow flex-row items-stretch gap-2 rounded-md border border-transparent px-3 py-1 font-bold ">
      <div
        className={`spaceName flex w-full min-w-0 grow justify-between bg-background text-grey-35`}
      >
        <div className="flex w-full flex-col gap-0">
          <div className="flex flex-row items-center gap-2">
            {session.session && (
              <Link href={`/s/${session.session.username}`}>
                <h4 className="text-sm text-grey-55 hover:text-accent-blue ">
                  home
                </h4>
              </Link>
            )}
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2 bg-inherit ">
            <SpaceName truncate />
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginButton = () => {
  let [state, setState] = LoginOrSignupModal.useState("closed");
  return (
    <>
      <ButtonPrimary content="Log In" onClick={() => setState("login")} />
      <LoginOrSignupModal state={state} setState={setState} />
    </>
  );
};

const MobileLayout = (props: Props) => {
  let setSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);
  let ref = useRef<HTMLDivElement>(null);
  let { setNodeRef: droppableRef, over } = useDroppableZone({
    type: "trigger",
    id: "mobile-sidebar-button",
    entityID: "mobile-sidebar-button",
  });

  useEffect(() => {
    if (over?.type === "room" || !over) return;
    let timeout = window.setTimeout(() => {
      setSidebarOpen(true);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [over]);

  let { active } = useDndContext();
  let bind = useGesture({
    onDrag: (data) => {
      if (
        (data.currentTarget as HTMLElement)?.scrollLeft === 0 &&
        data.direction[0] > 0 &&
        data.distance[0] > 8 &&
        data.distance[1] < 8
      ) {
        if (active?.data) return;
        setSidebarOpen(true);
      }
    },
  });

  return (
    <div className="mobileLayout flex h-full w-full flex-col">
      <div
        className="mobileRoomAndCard no-scrollbar pwa-padding my-2 flex h-full snap-x snap-mandatory flex-row overflow-y-hidden overflow-x-scroll overscroll-x-none scroll-smooth"
        {...bind()}
      >
        <div
          id="roomWrapper"
          className="roomWrapper relative flex snap-start snap-always flex-row  px-2 "
        >
          <div
            id="roomInnerWrapper"
            className="roomInnerWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border border-grey-90 "
          >
            <Room />
          </div>
        </div>

        <div className="cardViewerWrapper snap-center snap-always ">
          <CardViewer />
        </div>
        <div className="w-2 shrink-0 snap-start" />
      </div>
      <div className="navFooter pwa-padding-bottom flex flex-row justify-between px-2">
        <div
          className="sidebarTrigger flex flex-row gap-2 text-grey-55"
          ref={droppableRef}
        >
          <button onClick={() => setSidebarOpen()}>
            <SidebarIcon />
          </button>
        </div>
        <MobileSearch />
      </div>

      <MobileSidebar {...props} />
    </div>
  );
};

const MobileSidebar = (props: Props) => {
  let open = useUIState((s) => s.mobileSidebarOpen);
  let setSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);
  let { left } = useSpring({
    left: open ? 0 : -222,
    config: springConfig,
  });
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", open ? "#D4D0C8" : "#FFAF0");
  }, [open]);
  let opacity = useSpring({
    opacity: open ? 0.2 : 0,
  });
  let viewheight = useViewportSize().height;
  let { setNodeRef: droppableRef, over } = useDroppableZone({
    type: "trigger",
    id: "mobile-sidebar-overlay",
    entityID: "mobile-sidebar-overlay",
  });

  useEffect(() => {
    if (over?.type === "room" || !over) return;
    let timeout = window.setTimeout(() => {
      setSidebarOpen(false);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [over]);

  const bindOverlay = useGesture({
    onDrag: (data) => {
      if (data.direction[0] < 0) {
        setSidebarOpen(false);
      }
    },
  });

  const bindSidebar = useGesture({
    onDragEnd: (data) => {
      if (
        data.direction[0] < 0 &&
        data.velocity[0] > 0.1 &&
        data.velocity[1] < 0.5
      ) {
        setSidebarOpen(false);
      }
    },
  });

  return createPortal(
    <>
      {
        <animated.div
          {...bindOverlay()}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 touch-none bg-grey-15"
          style={{ ...opacity, display: open ? "block" : "none" }}
        >
          <div className="z-40 ml-auto h-full w-2/3" ref={droppableRef} />
        </animated.div>
      }
      <animated.div
        style={{ height: viewheight, left }}
        className="pwa-padding pwa-padding-bottom fixed top-0 z-50 ml-2 p-1 pl-0"
      >
        <div
          className="h-full touch-none rounded-md border border-grey-90 bg-white"
          {...bindSidebar()}
        >
          <Sidebar mobile studio={props.studio} />
        </div>
      </animated.div>
    </>,
    document.body
  );
};

export const HelpButton = () => {
  let [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="  text-grey-55 hover:text-accent-blue "
      >
        <Question />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};
