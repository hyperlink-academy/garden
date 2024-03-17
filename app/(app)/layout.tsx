import { PageHeightContainer } from "components/PageHeightContainer";
import { OpenSidebarOnSwipe } from "./@sidebar/SidebarLayout";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <PageHeightContainer
      id="appLayout"
      className="flex h-full w-full snap-x snap-mandatory scroll-pl-4 flex-row overflow-x-scroll overflow-y-scroll px-2 sm:gap-4 sm:px-8 "
    >
      <div className="appSidebarWrapper sticky left-0 top-0 z-50 flex items-stretch bg-transparent py-2 sm:w-auto">
        {props.sidebar}
      </div>
      <OpenSidebarOnSwipe className="appContentWrapper flex h-full flex-row gap-4 px-2 py-2 sm:gap-4">
        {props.children}
      </OpenSidebarOnSwipe>
    </PageHeightContainer>
  );
}

//the max width of the app content is determined by the widest width page we have, space.
//max width = card: 3xl(768px) flexgap: gap-4(16px) + roomWidth: 336px = 1120px
