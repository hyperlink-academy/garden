export const SidebarTab = (props: {
  title: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={() => props.onClick?.()}
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

export function CollapsedSidebarTab(props: {
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={() => {
        props.onClick?.();
      }}
      className={`shrink-0 rounded-md border border-transparent p-1 hover:border-grey-80 ${
        props.active ? "border-accent-blue bg-accent-blue text-white" : ""
      }`}
    >
      {props.icon}
    </button>
  );
}
