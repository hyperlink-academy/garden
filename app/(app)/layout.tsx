"use client";
import { useIsClient, useIsMobile } from "hooks/utils";
import { LayoutWrapper } from "./LayoutWrapper";
import { useSidebarState } from "./@sidebar/SidebarState";
import { animated, useSpring } from "@react-spring/web";
import { DisclosureExpandTiny } from "components/Icons";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  let { open, title } = useSidebarState();
  let isClient = useIsClient();
  let isMobile = useIsMobile();
  let mobileSidebarSpring = useSpring({
    left: open ? 0 : -262,
  });
  if (!isClient) return null;
  if (isMobile)
    return (
      <LayoutWrapper
        id="appLayout"
        className="no-scrollbar pwa-padding flex h-full w-full touch-none snap-x snap-mandatory scroll-pl-4 flex-col items-center overflow-x-scroll overflow-y-scroll px-2  sm:gap-4 sm:px-8 "
      >
        <div className=" fixed left-0 top-0 z-30 flex w-full flex-row  justify-between   px-3 pt-1">
          <button
            className="-rotate-90 rounded-full bg-background p-2 text-grey-55"
            onClick={() => {
              useSidebarState.getState().toggleSidebar();
            }}
          >
            <DisclosureExpandTiny />
          </button>
          <div
            className="h-fit rounded-md  px-2 py-1 text-sm text-grey-80 "
            style={
              document.getElementById("appLayout")?.scrollTop === 0
                ? {
                    backgroundColor: "pink",
                  }
                : { backgroundColor: "blue" }
            }
          >
            {title}
          </div>
          <div />
        </div>
        <div className="appContentWrapper no-scrollbar flex h-full flex-row gap-4 px-2  pb-2 pt-10 sm:gap-4">
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
