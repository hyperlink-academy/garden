export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex h-full w-full flex-row items-stretch justify-center gap-3 overflow-hidden p-2 sm:p-4">
      {props.sidebar}
      {props.children}
    </div>
  );
}
