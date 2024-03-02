export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="appLayout mx-auto flex h-full w-full flex-row justify-center gap-6 overflow-hidden ">
      <div className="appSidebarWrapper my-2 ml-2 flex items-stretch sm:my-4 sm:ml-4">
        {props.sidebar}
      </div>

      <div className="appContentWrapper no-scrollbar mr-2 flex w-full max-w-[1120px] items-stretch overflow-y-scroll py-2 sm:mr-4 sm:py-4">
        {props.children}
      </div>
    </div>
  );
}

//the max width of the app content is determined by the widest width page we have, space.
//max width = card: 3xl(768px) flexgap: gap-4(16px) + roomWidth: 336px = 1120px
