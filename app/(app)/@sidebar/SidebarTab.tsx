import { useIsMobile } from "hooks/utils";
import { useSidebarState } from "./SidebarLayout";

export const SidebarTab = (props: {
  collapsed: boolean;
  title: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) => {
  let isMobile = useIsMobile();
  let { setSidebar } = useSidebarState();

  if (props.collapsed)
    return (
      <button
        onClick={(e) => {
          props.onClick?.();
          e.stopPropagation();
        }}
        className={` shrink-0 rounded-md border border-transparent p-1 ${
          props.active
            ? "border-accent-blue bg-accent-blue text-white"
            : "hover:border-grey-80"
        }`}
      >
        {props.icon}
      </button>
    );
  return (
    <button
      onClick={(e) => {
        props.onClick?.();
        e.stopPropagation();

        if (isMobile) {
          setSidebar(false);
        }
      }}
      className={`sidebarTab relative select-none rounded-md border  ${
        props.active
          ? "border-accent-blue  text-accent-blue rounded-md font-bold"
          : " text-grey-35 hover:border-grey-80 border-transparent"
      }`}
    >
      <div
        style={{ wordBreak: "break-word" }}
        className={`sidebarTabContent flex w-full flex-row items-center gap-1 py-0.5 pl-1 pr-0.5 text-left ${
          props.active ? "font-bold" : ""
        }`}
      >
        {props.icon}
        {props.title}
      </div>
    </button>
  );
};
