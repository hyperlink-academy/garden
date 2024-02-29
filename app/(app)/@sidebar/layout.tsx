"use client";

export default function Sidebar(props: { children: React.ReactNode }) {
  return (
    <div className="h-full w-64 shrink-0 overflow-hidden border">
      <div className="w-full overflow-x-hidden">{props.children}</div>
    </div>
  );
}
