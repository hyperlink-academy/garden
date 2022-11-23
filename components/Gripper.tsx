// Here's the correct Gripper
export const GripperBG = (props: JSX.IntrinsicElements["div"]) => {
  return (
    <div
      {...props}
      className="w-[6px] h-full bg-grey-80 group-hover:bg-grey-55"
      style={{
        WebkitMaskImage: "url(/img/gripper.svg)",
        maskImage: "url(/img/gripper.svg)",
        maskRepeat: "repeat-y",
      }}
    />
  );
};
