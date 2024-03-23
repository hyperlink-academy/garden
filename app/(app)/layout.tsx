"use client";
import { useIsClient, useIsMobile } from "hooks/utils";
import { LayoutWrapper } from "./LayoutWrapper";
import { useSidebarState } from "./@sidebar/SidebarState";
import { animated, useSpring } from "@react-spring/web";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  let { open } = useSidebarState();
  let isClient = useIsClient();
  let isMobile = useIsMobile();
  let mobileSidebarSpring = useSpring({
    left: open ? 0 : -256,
  });
  if (!isClient) return null;
  if (isMobile)
    return (
      <LayoutWrapper
        id="appLayout"
        className="flex h-full w-full snap-x snap-mandatory scroll-pl-4 flex-col overflow-x-scroll overflow-y-scroll px-2 pt-8 sm:gap-4 sm:px-8 "
      >
        <div className="fixed top-1">
          <button
            onClick={() => {
              useSidebarState.getState().toggleSidebar();
            }}
          >
            tog
          </button>
        </div>
        <div className="appContentWrapper flex h-full flex-row gap-4 px-2 py-2 sm:gap-4">
          {props.children}
        </div>
        <animated.div
          style={mobileSidebarSpring}
          className={`fixed top-0 z-30 flex h-full`}
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
      <div className="appSidebarWrapper sticky left-0 top-0 z-20 flex items-stretch bg-transparent py-2 sm:w-auto">
        {props.sidebar}
      </div>
      <div className="appContentWrapper flex h-full flex-row gap-4 px-2 py-2 sm:gap-4">
        {props.children}
      </div>
    </LayoutWrapper>
  );
}
