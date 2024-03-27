export function MobileHeaderTitle(props: { title: string }) {
  return (
    <div className="sidebarSpaceName mx-auto h-fit w-fit shrink-0 flex-row self-center rounded-full border border-grey-55 px-1 text-xs font-bold">
      {props.title
        .split(" ")
        .map((s) => Array.from(s)[0].toLocaleUpperCase())
        .join("")}
    </div>
  );
}
