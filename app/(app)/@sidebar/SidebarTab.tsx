import { useIsMobile } from "hooks/utils";
import { useSidebarState } from "./SidebarState";

export const SidebarTab = (props: {
  collapsed: boolean;
  title: string;
  icon: React.ReactNode;
  active: boolean;
  className?: string;
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
        } ${props.className}`}
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
          ? "rounded-md  border-accent-blue font-bold text-accent-blue"
          : " border-transparent text-grey-35 hover:border-grey-80"
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
