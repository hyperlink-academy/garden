export default function AppLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-row gap-2">
      {props.sidebar}
      {props.children}
    </div>
  );
}
