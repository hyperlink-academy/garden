"use client";
import { useIsClient, useIsMobile } from "hooks/utils";
import { LayoutWrapper, SideScrollSidebarHandler } from "./LayoutWrapper";
import { useViewportDifference } from "hooks/useViewportSize";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  let isClient = useIsClient();
  let isMobile = useIsMobile();
  let difference = useViewportDifference();
  if (!isClient) return null;
  if (isMobile)
    return (
      <LayoutWrapper
        id="heightWrapper"
        className="no-scrollbar relative flex h-[calc(100%+env(safe-area-inset-top))] pt-10"
      >
        {props.sidebar}
        <SideScrollSidebarHandler
          className="no-scrollbar pwa-padding h-full w-full snap-x snap-mandatory overflow-x-scroll overflow-y-scroll"
          id="appLayout"
        >
          <div
            className={`appContentWrapper no-scrollbar flex h-full w-fit flex-row gap-4 px-2 sm:gap-4
              ${difference === 0 ? "pwa-padding-bottom" : ""}
            `}
          >
            {props.children}
          </div>
        </SideScrollSidebarHandler>
      </LayoutWrapper>
    );

  return (
    <LayoutWrapper id="heightWrapper" className="pwa-padding h-full">
      <SideScrollSidebarHandler
        id="appLayout"
        className="flex h-full w-full snap-x snap-mandatory scroll-pl-4 flex-row overflow-x-scroll overflow-y-scroll px-4 sm:gap-4"
      >
        <div className="appSidebarWrapper sticky left-0 top-0 z-40 flex items-stretch bg-transparent py-2 sm:w-auto">
          {props.sidebar}
        </div>
        <div className="appContentWrapper flex h-full flex-row gap-4 px-2 py-2 sm:gap-4">
          {props.children}
        </div>
      </SideScrollSidebarHandler>
    </LayoutWrapper>
  );
}
