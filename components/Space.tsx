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
import { WORKER_URL, springConfig } from "src/constants";
import { useViewportSize } from "hooks/useViewportSize";
import { InfoTiny, Information, Question, SidebarIcon } from "components/Icons";
import { SpaceName, SpaceOptions } from "components/SpaceLayout/Sidebar";
import { useSpring, animated } from "@react-spring/web";
import { createPortal } from "react-dom";
import { useAuth } from "hooks/useAuth";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { LoginOrSignupModal } from "components/LoginModal";
import Link from "next/link";
import { Search, MobileSearch } from "components/Search";
import { HelpModal } from "components/HelpCenter";
import { useGesture } from "@use-gesture/react";
import { useDndContext } from "@dnd-kit/core";
import { useSpaceShortcuts } from "hooks/useSpaceShortcuts";
import { SpaceData } from "components/SpacesList";
import { SpaceViewerHeader } from "app/(app)/studio/[studio_id]/space/SpaceViewerHeader";
import { useIsClient } from "hooks/utils";
import * as Popover from "@radix-ui/react-popover";
import { useSpaceData } from "hooks/useSpaceData";
import { spaceAPI } from "backend/lib/api";

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
        <div className="flex flex-col place-items-end gap-1 ">
          <HelpButton />

          <div className="spaceHeaderSearch flex w-[480px] shrink-0 flex-row items-center gap-0 text-grey-55">
            {session.loggedIn && <SpaceOptions space_id={props.space_id} />}

            <SpaceRoleBadge space_id={props.space_id} />

            <Search />
          </div>
        </div>
      </div>
      <div
        id="space-layout"
        className=" no-scrollbar spaceLargeSplitLayout mx-auto flex h-full w-full max-w-[1332px] snap-x snap-mandatory flex-row items-stretch gap-4 overflow-y-hidden overflow-x-scroll scroll-smooth px-4 sm:gap-4  md:overflow-x-hidden"
      >
        <div className="spaceRoomAndSidebar flex shrink-0  snap-center snap-always flex-row  rounded-md border border-grey-90">
          <div className="shrink-0 rounded-l-md border border-transparent border-r-grey-90 bg-white">
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

const SpaceRoleBadge = (props: { space_id: string }) => {
  let { session, authToken } = useAuth();
  let { data: spaceData, mutate } = useSpaceData(props);
  let isMember = spaceData?.members_in_spaces.find(
    (m) => m.member === session.user?.id
  );
  let isStudioMate = spaceData?.spaces_in_studios.find(
    (s) =>
      !!s.studios?.members_in_studios.find((f) => f.member === session.user?.id)
  );

  let spaceIsOpenInvite = spaceData?.spaces_in_studios?.find(
    (s) => s.studios?.allow_members_to_join_spaces
  )?.studios?.allow_members_to_join_spaces;

  return (
    <div className="flex gap-2">
      <div
        className={`flex h-[30px] w-fit items-center gap-2 place-self-end rounded-full border px-[8px] py-[2px] text-sm font-bold ${
          isMember
            ? "ml-2 border-grey-80 bg-bg-blue text-grey-55"
            : isStudioMate
            ? "border-grey-80 bg-grey-90 text-grey-55 "
            : "border-grey-80 text-grey-55"
        }`}
      >
        {isMember ? (
          <InfoPopover triggerTitle="Member">
            <p>
              <b>You have full access!</b> Make and edit cards, comment, chat,
              anything you want!
            </p>
          </InfoPopover>
        ) : isStudioMate ? (
          <InfoPopover triggerTitle="Studiomate">
            <p>
              You can <b>chat and comment on cards</b> here!
            </p>
            <p>
              To make and edit cards, you need to join this Space.
              {!spaceIsOpenInvite && " Ask a member to invite you!"}
            </p>
          </InfoPopover>
        ) : (
          <div className="flex w-max items-center">
            <div>Guest</div>
          </div>
        )}
      </div>

      {!session.loggedIn && <LoginButton />}

      {!isMember && isStudioMate && spaceIsOpenInvite && (
        <ButtonSecondary
          content="Join!"
          className="!mr-2 !bg-transparent !py-[1px]"
          onClick={async () => {
            if (!authToken) return;
            let data = await spaceAPI(
              `${WORKER_URL}/space/${spaceData?.do_id}`,
              "join",
              {
                authToken,
                code: "",
                joinFromStudioMate: true,
              }
            );
            if (data.success) mutate();
          }}
        />
      )}
    </div>
  );
};

const Header = (props: { space_id: string }) => {
  let { session } = useAuth();
  return (
    <div className="spaceHeaderInfo -mb-1 ml-2 flex min-w-0 shrink grow flex-row items-stretch gap-2 px-3 py-1 font-bold ">
      <div className="spaceName flex w-full min-w-0 grow justify-between bg-background text-grey-35">
        <div className="flex w-full flex-col gap-0">
          <div className="flex flex-row items-center gap-2">
            {session.session && (
              <Link href={`/s/${session.session.username}`}>
                <h4 className="text-sm text-grey-55 hover:text-accent-blue">
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
      <ButtonPrimary
        content="Log In"
        onClick={() => setState("login")}
        className="!mr-2 !py-[1px]"
      />
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
            className="roomInnerWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border border-grey-90 "
          >
            <Room />
          </div>
        </div>

        <div className="cardViewerWrapper snap-center snap-always ">
          <CardViewer space_id={props.space_id} />
        </div>
        <div className="w-2 shrink-0 snap-start" />
      </div>
      <div className="mobileFooter pwa-padding-bottom flex w-full flex-row gap-2 px-2">
        <div
          className="sidebarTrigger flex grow flex-row gap-2 text-grey-55"
          ref={droppableRef}
        >
          <button onClick={() => setSidebarOpen()}>
            <SidebarIcon />
          </button>
        </div>
        <div color="">
          <SpaceRoleBadge space_id={props.space_id} />
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
          className="fixed inset-0 z-40 touch-none bg-grey-15"
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
          className="h-full touch-none rounded-md border border-grey-90 bg-white"
          {...bindSidebar()}
        >
          <Sidebar mobile studio={props.studio} space_id={props.space_id} />
        </div>
      </animated.div>
    </>,
    document.body
  );
};

export const HelpButton = (props: { onClick?: () => void }) => {
  let [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          props.onClick?.();
        }}
        className="mr-2 w-fit text-sm text-grey-55 hover:text-accent-blue hover:underline"
      >
        help docs!
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const InfoPopover = (props: {
  children: React.ReactNode;
  triggerTitle: string;
}) => {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <button className="flex place-items-center gap-1">
          {props.triggerTitle}
          <InfoTiny />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={2} collisionPadding={16} className="z-50">
          <div className="lightBorder rounded-sm flex max-w-xs flex-col gap-2 bg-white p-2 text-xs font-normal text-grey-55 shadow-lg">
            {props.children}
          </div>
          <Popover.Close />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
