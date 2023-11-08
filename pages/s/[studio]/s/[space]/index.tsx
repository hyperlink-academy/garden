import { CardViewer } from "components/CardViewerContext";
import { SmallCardDragContext } from "components/DragContext";
import { Sidebar } from "components/SpaceLayout";
import { useEffect, useState } from "react";
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
import {
  Information,
  Question,
  SidebarIcon,
  StudioFilled,
} from "components/Icons";
import { SpaceName } from "components/SpaceLayout/Sidebar";
import { config, useSpring, animated } from "@react-spring/web";
import { createPortal } from "react-dom";
import { useAuth } from "hooks/useAuth";
import { ButtonPrimary } from "components/Buttons";
import { LogInModal } from "components/LoginModal";
import Link from "next/link";
import { Search } from "components/Search";
import { HelpModal } from "components/HelpCenter";

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
  let room = useRoom();
  const { width } = useWindowDimensions();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("roomInnerWrapper");
      roomPane?.scrollIntoView();
    });
  }, []);

  let viewheight = useViewportSize().height;
  usePreventResize();

  return (
    <>
      <SpaceMetaTitle />
      <PresenceHandler />

      <div
        style={{ height: viewheight }}
        className="spaceontent max-w-screen-xl relative mx-auto flex h-full w-full grow md:px-4 md:py-6"
      >
        <SmallCardDragContext>
          {width > 960 || width === 0 ? (
            <DesktopLayout room={room} />
          ) : (
            <MobileLayout room={room} />
          )}
        </SmallCardDragContext>
      </div>
    </>
  );
}

const DesktopLayout = ({ room }: { room: string }) => {
  let { session } = useAuth();
  return (
    <div className="no-scrollbar mx-auto flex h-full flex-col gap-2 overflow-x-scroll">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-stretch gap-2 font-bold">
          {session.session && (
            <>
              <Link
                href={`/s/${session.session.username}`}
                className="flex flex-row gap-2"
              >
                <StudioFilled className="text-grey-55" /> <span> /</span>
              </Link>
            </>
          )}
          <div className="text-grey-35">
            <SpaceName />
          </div>
          {!session.loggedIn && <LoginButton />}
        </div>
        <div className="flex flex-row gap-2">
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
            <Room entityID={room} key={room} />
          </div>
        </div>

        <CardViewer room={room} />
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

const MobileLayout = ({ room }: { room: string }) => {
  let setSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);
  return (
    <div className="flex h-full w-full flex-col">
      <div className="no-scrollbar pwa-padding my-2 flex h-full snap-x snap-mandatory flex-row overflow-y-hidden overflow-x-scroll overscroll-x-none scroll-smooth">
        <div
          id="roomWrapper"
          className="roomWrapper relative flex snap-center snap-always flex-row  px-2 "
        >
          <div
            id="roomInnerWrapper"
            className="roomInnerWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border border-grey-90 px-2 "
          >
            <Room entityID={room} key={room} />
          </div>
        </div>

        <div className="snap-start snap-always ">
          <CardViewer room={room} />
        </div>
        <div className="w-2 shrink-0 snap-start" />
      </div>
      <div className="flex flex-row justify-between px-2 pb-1">
        <div className="flex flex-row gap-2 text-grey-55">
          <button onClick={() => setSidebarOpen()}>
            <SidebarIcon />
          </button>
        </div>
        search
      </div>

      <MobileSidebar />
    </div>
  );
};

const MobileSidebar = () => {
  let open = useUIState((s) => s.mobileSidebarOpen);
  let { left } = useSpring({ left: open ? 0 : -222, config: springConfig });
  let viewheight = useViewportSize().height;
  return createPortal(
    <animated.div
      style={{ height: viewheight, left }}
      className="fixed top-0 z-30 ml-2 snap-end snap-always p-1 pl-0"
    >
      <div className="h-full rounded-md border border-grey-90 bg-white">
        <Sidebar mobile />
      </div>
    </animated.div>,
    document.body
  );
};

const HelpButton = () => {
  let [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-grey-55">
        <Question />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};
