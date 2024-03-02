export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className=" mx-auto flex h-full w-full flex-row justify-center gap-4 overflow-hidden ">
      <div className="flex items-stretch py-2 pl-2 sm:py-4 sm:pl-4">
        {props.sidebar}
      </div>

      <div className=" no-scrollbar flex  items-stretch  overflow-y-scroll py-2 pr-2 sm:py-4 sm:pr-4">
        {props.children}
      </div>
    </div>
  );
}
