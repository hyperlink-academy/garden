import { CardViewer } from "components/CardViewerContext";
import { SmallCardDragContext, useDroppableZone } from "components/DragContext";
import { Sidebar } from "components/SpaceLayout";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { Room } from "components/Room";
import { SpaceMetaTitle } from "components/SpaceMetaTitle";
import { useRoom, useUIState } from "hooks/useUIState";
import { PresenceHandler } from "components/PresenceHandler";
import { useSpaceSyncState } from "hooks/useSpaceSyncState";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL, springConfig } from "src/constants";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next/types";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SWRConfig } from "swr";
import { useViewportSize } from "hooks/useViewportSize";
import { usePreventResize } from "hooks/usePreventResize";
import { Question, SidebarIcon, StudioFilled } from "components/Icons";
import { SpaceName } from "components/SpaceLayout/Sidebar";
import { config, useSpring, animated } from "@react-spring/web";
import { createPortal } from "react-dom";
import { useAuth } from "hooks/useAuth";
import { ButtonPrimary } from "components/Buttons";
import { LogInModal } from "components/LoginModal";
import Link from "next/link";
import { Search, MobileSearch } from "components/Search";
import { HelpModal } from "components/HelpCenter";
import { useGesture } from "@use-gesture/react";
import { useDndContext } from "@dnd-kit/core";
import { useSpaceShortcuts } from "hooks/useSpaceShortcuts";

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.space || !ctx.params?.studio)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let data = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: ctx.params?.space as string,
    username: ctx.params?.studio as string,
  });

  if (!data.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, data: data.data } };
}

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function SpacePage(props: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (props.notFound) return <div>404 - page not found!</div>;
  if (!isClient) return null;

  return (
    <SWRConfig value={{ fallback: { [props.data.do_id]: props.data } }}>
      <SpaceProvider id={props.data.do_id}>
        <Space />
      </SpaceProvider>
    </SWRConfig>
  );
}
function Space() {
  useSpaceSyncState();
  useSpaceShortcuts();
  const { width } = useWindowDimensions();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("roomInnerWrapper");
      roomPane?.scrollIntoView();
    });
  }, []);

  let viewheight = useViewportSize().height;
  let heightSpring = useSpring({
    height: viewheight,
  });
  usePreventResize();

  return (
    <>
      <SpaceMetaTitle />
      <PresenceHandler />

      <animated.div
        style={heightSpring}
        className="spacecontent max-w-screen-xl relative mx-auto flex h-full w-full grow md:px-4 md:py-4 md:pb-2"
      >
        <SmallCardDragContext>
          {width > 960 || width === 0 ? <DesktopLayout /> : <MobileLayout />}
        </SmallCardDragContext>
      </animated.div>
    </>
  );
}

const DesktopLayout = () => {
  let { session } = useAuth();
  return (
    <div className="no-scrollbar mx-auto flex h-full flex-col gap-2 overflow-x-scroll">
      <div className="spaceHeader flex w-full flex-row  justify-stretch gap-4 ">
        <div className="spaceHeaderInfo flex min-w-0 shrink grow  flex-row items-stretch gap-2 font-bold">
          {session.session && (
            <>
              <Link
                href={`/s/${session.session.username}`}
                className="flex flex-row items-center gap-1 text-grey-55 "
              >
                <StudioFilled className="hover:text-accent-blue" />
                <span className="text-lg"> /</span>
              </Link>
            </>
          )}
          <SpaceName className="grow bg-background" />{" "}
          {!session.loggedIn && <LoginButton />}
        </div>
        <div className="spaceHeaderSearch flex w-[360px] shrink-0 flex-row gap-0">
          <HelpButton />
          <Search />
        </div>
      </div>
      <div className="spaceLargeSplitLayout flex h-[calc(100%-46px)] w-full flex-row items-stretch gap-4 sm:justify-center sm:gap-4">
        <div className="spaceRoomAndSidebar flex flex-row rounded-md border border-grey-90">
          <div className="rounded-l-md border border-transparent border-r-grey-90 bg-white">
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

const LoginButton = () => {
  let [logInOpen, setLogInOpen] = useState(false);
  return (
    <>
      <ButtonPrimary
        content="Log In"
        onClick={() => setLogInOpen(!logInOpen)}
      />
      <LogInModal isOpen={logInOpen} onClose={() => setLogInOpen(false)} />
    </>
  );
};

const MobileLayout = () => {
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

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="no-scrollbar pwa-padding my-2 flex h-full snap-x snap-mandatory flex-row overflow-y-hidden overflow-x-scroll overscroll-x-none scroll-smooth"
        ref={ref}
      >
        <div
          id="roomWrapper"
          className="roomWrapper relative flex snap-start snap-always flex-row  px-2 "
        >
          <div
            id="roomInnerWrapper"
            className="roomInnerWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border border-grey-90 px-2 "
          >
            <Room />
          </div>
        </div>

        <div className="snap-center snap-always ">
          <CardViewer />
        </div>
        <div className="w-2 shrink-0 snap-start" />
      </div>
      <div className="flex flex-row justify-between px-2 pb-1">
        <div className="flex flex-row gap-2 text-grey-55" ref={droppableRef}>
          <button onClick={() => setSidebarOpen()}>
            <SidebarIcon />
          </button>
        </div>
        <MobileSearch />
      </div>

      <MobileSidebar containerRef={ref} />
    </div>
  );
};

const MobileSidebar = ({
  containerRef,
}: {
  containerRef: MutableRefObject<HTMLDivElement | null>;
}) => {
  let open = useUIState((s) => s.mobileSidebarOpen);
  let setSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);
  let { left } = useSpring({
    left: open ? 0 : -222,
    config: springConfig,
  });
  let opacity = useSpring({
    opacity: open ? 0.2 : 0,
  });
  let viewheight = useViewportSize().height;
  let { setNodeRef: droppableRef, over } = useDroppableZone({
    type: "trigger",
    id: "mobile-sidebar-overlay",
    entityID: "mobile-sidebar-overlay",
  });
  let { active } = useDndContext();

  useEffect(() => {
    if (over?.type === "room" || !over) return;
    let timeout = window.setTimeout(() => {
      setSidebarOpen(false);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [over]);
  useGesture(
    {
      onDrag: (data) => {
        if (
          containerRef.current?.scrollLeft === 0 &&
          data.direction[0] > 0 &&
          data.distance[0] > 8 &&
          data.distance[1] < 8
        ) {
          if (active?.data) return;
          setSidebarOpen(true);
        }
      },
    },
    { target: containerRef }
  );

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
        className="fixed top-0 z-50 ml-2 p-1 pl-0"
      >
        <div
          className="h-full touch-none rounded-md border border-grey-90 bg-white"
          {...bindSidebar()}
        >
          <Sidebar mobile />
        </div>
      </animated.div>
    </>,
    document.body
  );
};

const HelpButton = () => {
  let [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className=" -mr-[6px] ml-[6px] text-grey-55 "
      >
        <Question />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};
