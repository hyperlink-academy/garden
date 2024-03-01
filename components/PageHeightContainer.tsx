"use client";
import { isIOS } from "@react-aria/utils";
import { animated, useSpring } from "@react-spring/web";
import { useViewportDifference, useViewportSize } from "hooks/useViewportSize";

export function PageHeightContainer(props: { children: React.ReactNode }) {
  let viewheight = useViewportSize().height;
  let difference = useViewportDifference();
  let heightSpring = useSpring({
    height: viewheight,
  });

  return (
    <>
      <animated.div
        style={
          isIOS()
            ? difference > 10
              ? heightSpring
              : undefined
            : { height: "auto" }
        }
        className="spaceContent relative flex h-full overflow-hidden "
      >
        {props.children}
      </animated.div>
    </>
  );
}
