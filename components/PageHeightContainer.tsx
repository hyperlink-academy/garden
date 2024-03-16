"use client";
import { isIOS } from "@react-aria/utils";
import { animated, useSpring } from "@react-spring/web";
import { useViewportDifference, useViewportSize } from "hooks/useViewportSize";

export function PageHeightContainer(props: {
  id: string;
  children: React.ReactNode;
  className: string;
}) {
  let viewheight = useViewportSize().height;
  let difference = useViewportDifference();
  let heightSpring = useSpring({
    height: viewheight,
  });

  return (
    <>
      <animated.div
        id={props.id}
        className={props.className}
        style={
          isIOS()
            ? difference > 10
              ? heightSpring
              : undefined
            : { height: "100%" }
        }
      >
        {props.children}
      </animated.div>
    </>
  );
}
