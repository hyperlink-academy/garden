export default function Sidebar(props: { children: React.ReactNode }) {
  return <div className="h-full w-96 border">{props.children}</div>;
}
