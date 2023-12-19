"use client";
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
        style={difference > 100 ? heightSpring : undefined}
        className="spacecontent max-w-screen-xl relative mx-auto flex h-screen w-full grow overflow-y-hidden pb-2  sm:pb-4 sm:pt-2"
      >
        {props.children}
      </animated.div>
    </>
  );
}
