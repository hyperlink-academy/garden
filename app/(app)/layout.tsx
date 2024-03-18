import { LayoutWrapper } from "./LayoutWrapper";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
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
