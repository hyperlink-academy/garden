export const RoomWrapper = (props: { children: React.ReactNode }) => {
  return (
    <div className="no-scrollbar flex h-full w-[336px] flex-col items-stretch overflow-x-hidden overflow-y-scroll p-2 text-sm sm:p-4 ">
      {props.children}
    </div>
  );
};
