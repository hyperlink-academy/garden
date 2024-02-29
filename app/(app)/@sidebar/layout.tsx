"use client";

export default function Sidebar(props: { children: React.ReactNode }) {
  return (
    <div className="lightBorder  my-3 flex w-64 shrink-0 flex-col overflow-hidden bg-white sm:my-4">
      <div className="h-full w-full overflow-x-hidden  pb-3 pt-2">
        {props.children}
      </div>
    </div>
  );
}
