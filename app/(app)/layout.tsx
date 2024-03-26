"use client";
import { useIsClient, useIsMobile } from "hooks/utils";
import { LayoutWrapper } from "./LayoutWrapper";
import { useSidebarState } from "./@sidebar/SidebarState";
import { animated, useSpring } from "@react-spring/web";
import { DisclosureExpandTiny } from "components/Icons";
import { Truncate } from "components/Truncate";
import { useAuth } from "hooks/useAuth";
import { LoginButton, LoginOrSignupModal } from "components/LoginModal";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  let { open, title } = useSidebarState();
  let isClient = useIsClient();
  let isMobile = useIsMobile();
  let { session } = useAuth();
  let mobileSidebarSpring = useSpring({
    left: open ? 0 : -262,
  });
  if (!isClient) return null;
  if (isMobile)
    return (
      <LayoutWrapper
        id="appLayout"
        className="no-scrollbar pwa-padding flex h-full w-full touch-none snap-x snap-mandatory scroll-pl-4 flex-col overflow-x-scroll overflow-y-scroll px-2  sm:gap-4 sm:px-8 "
      >
        <div className="mobileHeaderWrapper sticky left-0 right-0 top-0 z-30 w-full pt-2">
          <div className="mobileHeader flex w-full gap-2 rounded-md border border-grey-90 bg-background p-1">
            <button
              className="mobileHeaderToggle shrink-0 -rotate-90 rounded-full text-grey-55"
              onClick={() => {
                useSidebarState.getState().toggleSidebar();
              }}
            >
              <DisclosureExpandTiny />
            </button>
            <div className="MobileHeaderTitle w-full min-w-0 grow text-center text-sm text-grey-55">
              <Truncate className=" bg-background">
                {title === session?.session?.username ? "home" : title}
              </Truncate>
            </div>
            {!session.loggedIn ? <LoginButton small /> : <div />}
          </div>
        </div>
        <div className="appContentWrapper no-scrollbar flex h-full w-fit flex-row gap-4 pb-2 pt-2 sm:gap-4">
          {props.children}
        </div>
        <animated.div
          style={mobileSidebarSpring}
          className={`fixed top-0 z-30 flex h-full py-1 pl-1`}
        >
          {props.sidebar}
        </animated.div>
      </LayoutWrapper>
    );

  return (
    <LayoutWrapper
      id="appLayout"
      className="flex h-full w-full snap-x snap-mandatory scroll-pl-4 flex-row overflow-x-scroll overflow-y-scroll px-2 sm:gap-4 sm:px-8 "
    >
      <div className="appSidebarWrapper sticky left-0 top-0 z-40 flex items-stretch bg-transparent py-2 sm:w-auto">
        {props.sidebar}
      </div>
      <div className="appContentWrapper flex h-full flex-row gap-4 px-2 py-2 sm:gap-4">
        {props.children}
      </div>
    </LayoutWrapper>
  );
}
