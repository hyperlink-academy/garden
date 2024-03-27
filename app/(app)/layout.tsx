"use client";
import { useIsClient, useIsMobile } from "hooks/utils";
import { LayoutWrapper } from "./LayoutWrapper";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  let isClient = useIsClient();
  let isMobile = useIsMobile();
  if (!isClient) return null;
  if (isMobile)
    return (
      <LayoutWrapper
        id="appLayout"
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory scroll-pl-4 flex-col overflow-x-scroll overflow-y-scroll  px-2 pt-10 "
      >
        {props.sidebar}
        <div className="appContentWrapper no-scrollbar flex h-full w-fit flex-row gap-4 pb-2 pt-2 sm:gap-4">
          {props.children}
        </div>
      </LayoutWrapper>
    );

  return (
    <LayoutWrapper
      id="appLayout"
      className="flex h-full w-full snap-x snap-mandatory scroll-pl-4 flex-row overflow-x-scroll overflow-y-scroll px-2 sm:gap-4 sm:px-4"
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
