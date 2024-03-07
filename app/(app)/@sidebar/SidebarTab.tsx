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
