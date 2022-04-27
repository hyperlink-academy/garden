type DivProps = JSX.IntrinsicElements["div"];
export const Gripper = (props: DivProps) => {
  return (
    <div {...props}>
      <svg
        width="6"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="Pattern"
            x="0"
            y="0"
            width="6"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <rect width="2" height="2" rx="1" fill="currentColor" />
            <rect y="4" width="2" height="2" rx="1" fill="currentColor" />
            <rect x="4" width="2" height="2" rx="1" fill="currentColor" />
            <rect x="4" y="4" width="2" height="2" rx="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect fill="url(#Pattern)" width="6" height="100%" />
      </svg>
    </div>
  );
};
