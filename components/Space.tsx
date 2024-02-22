"use client";
import { CardViewer } from "components/CardViewerContext";
import { SmallCardDragContext, useDroppableZone } from "components/DragContext";
import { Sidebar } from "components/SpaceLayout";
import { useEffect, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { Room } from "components/Room";
import { useUIState } from "hooks/useUIState";
import { PresenceHandler } from "components/PresenceHandler";
import { useSpaceSyncState } from "hooks/useSpaceSyncState";
import { springConfig } from "src/constants";
import { useViewportSize } from "hooks/useViewportSize";
import { Information, Question, SidebarIcon } from "components/Icons";
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
import * as Popover from "@radix-ui/react-popover";

type Props = {
  studio?: { spaces: SpaceData[]; studioName: string; studioID: string };
  space_id: string;
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
        {props.studio ? (
          <SpaceViewerHeader {...props.studio} space_id={props.space_id} />
        ) : (
          <Header space_id={props.space_id} />
        )}
        <div>
          <div className="bg-bg-blue lightBorder mx-3 flex w-fit items-center gap-1 px-2 py-1 text-sm font-bold sm:mx-4">
            You&apos;re a Studiomate!{" "}
            <InfoPopover>
              <p>You can comment and react on cards. You can also chat!</p>{" "}
              <p>
                In order to make and edit cards, you need to become a space
                member!
              </p>
            </InfoPopover>
            <ButtonPrimary content="join!" />
          </div>
          <div className="spaceHeaderSearch text-grey-55 flex w-[440px] shrink-0 flex-row items-center gap-2">
            <HelpButton />

            {!session.loggedIn ? (
              <LoginButton />
            ) : (
              <SpaceOptions space_id={props.space_id} />
            )}

            <Search />
          </div>
        </div>
      </div>
      <div
        id="space-layout"
        className=" no-scrollbar spaceLargeSplitLayout mx-auto flex h-full w-full max-w-[1332px] snap-x snap-mandatory flex-row items-stretch gap-4 overflow-y-hidden overflow-x-scroll scroll-smooth px-4 sm:gap-4  md:overflow-x-hidden"
      >
        <div className="spaceRoomAndSidebar border-grey-90 flex  shrink-0 snap-center snap-always  flex-row rounded-md border">
          <div className="border-r-grey-90 shrink-0 rounded-l-md border border-transparent bg-white">
            <Sidebar space_id={props.space_id} />
          </div>

          <div className="spaceRoomWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0">
            <Room />
          </div>
        </div>

        <CardViewer space_id={props.space_id} />
      </div>
    </div>
  );
};

const Header = (props: { space_id: string }) => {
  let { session } = useAuth();
  return (
    <div className="spaceHeaderInfo -mb-1 ml-2 flex min-w-0 shrink grow flex-row items-stretch gap-2 px-3 py-1 font-bold ">
      <div className="spaceName bg-background text-grey-35 flex w-full min-w-0 grow justify-between">
        <div className="flex w-full flex-col gap-0">
          <div className="flex flex-row items-center gap-2">
            {session.session && (
              <Link href={`/s/${session.session.username}`}>
                <h4 className="text-grey-55 hover:text-accent-blue text-sm">
                  home
                </h4>
              </Link>
            )}
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2 bg-inherit">
            <SpaceName truncate space_id={props.space_id} />
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
  }, [over, setSidebarOpen]);

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
        id="space-layout"
        className="mobileRoomAndCard no-scrollbar pwa-padding my-2 flex h-full touch-none snap-x snap-mandatory flex-row overflow-y-hidden overflow-x-scroll overscroll-x-none scroll-smooth"
        {...bind()}
      >
        <div
          id="roomWrapper"
          className="roomWrapper relative flex snap-start snap-always flex-row  px-2 "
        >
          <div
            id="roomInnerWrapper"
            className="roomInnerWrapper no-scrollbar border-grey-90 relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border "
          >
            <Room />
          </div>
        </div>

        <div className="cardViewerWrapper snap-center snap-always ">
          <CardViewer space_id={props.space_id} />
        </div>
        <div className="w-2 shrink-0 snap-start" />
      </div>
      <div className="navFooter pwa-padding-bottom flex flex-row justify-between px-2">
        <div
          className="sidebarTrigger text-grey-55 flex flex-row gap-2"
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
  }, [over, setSidebarOpen]);

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
          className="bg-grey-15 fixed inset-0 z-40 touch-none"
          style={{ ...opacity, display: open ? "block" : "none" }}
        >
          <div className="z-40 ml-auto h-full w-2/3" ref={droppableRef} />
        </animated.div>
      }
      <animated.div
        style={{ height: viewheight, left }}
        className="pwa-padding pwa-padding-bottom fixed top-0 z-50 ml-2 p-1 py-[2px] pl-0"
      >
        <div
          className="border-grey-90 h-full touch-none rounded-md border bg-white"
          {...bindSidebar()}
        >
          <Sidebar mobile studio={props.studio} space_id={props.space_id} />
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

const InfoPopover = (props: { children: React.ReactNode }) => {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <button className="flex place-items-center ">
          <Information />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={2} className="z-50">
          <div className="lightBorder text-grey-55 flex max-w-xs flex-col gap-2 rounded-sm bg-white p-2 text-xs font-normal shadow-lg">
            {props.children}
          </div>
          <Popover.Close />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
