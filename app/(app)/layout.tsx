import { OpenSidebarOnSwipe } from "./@sidebar/SidebarLayout";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <OpenSidebarOnSwipe className="appLayout mx-auto flex h-full w-full flex-row gap-4 overflow-y-scroll">
      <div className="appSidebarWrapper sticky left-0 top-0 z-50 flex w-4 items-stretch bg-transparent py-2 pl-2 sm:w-auto">
        {props.sidebar}
      </div>
      <div className="appContentWrapper flex py-2 pr-2 sm:py-4">
        {props.children}
      </div>
    </OpenSidebarOnSwipe>
  );
}

//the max width of the app content is determined by the widest width page we have, space.
//max width = card: 3xl(768px) flexgap: gap-4(16px) + roomWidth: 336px = 1120px
