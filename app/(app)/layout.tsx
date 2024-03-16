import { OpenSidebarOnSwipe } from "./@sidebar/SidebarLayout";

export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <OpenSidebarOnSwipe className="appLayout  flex h-full w-full flex-row gap-2 overflow-y-scroll  px-2 sm:gap-4 sm:px-8 ">
      <div className="appSidebarWrapper sticky left-0 top-0 z-50 flex items-stretch bg-transparent py-2 sm:w-auto sm:py-4">
        {props.sidebar}
      </div>
      <div className="appContentWrapper no-scrollbar flex w-full overflow-y-scroll py-2 sm:py-4">
        {props.children}
      </div>
    </OpenSidebarOnSwipe>
  );
}

//the max width of the app content is determined by the widest width page we have, space.
//max width = card: 3xl(768px) flexgap: gap-4(16px) + roomWidth: 336px = 1120px
