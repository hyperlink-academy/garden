"use client";
import { useDndContext } from "@dnd-kit/core";
import { isIOS, useViewportSize } from "@react-aria/utils";
import { animated, useSpring } from "@react-spring/web";
import { useViewportDifference } from "hooks/useViewportSize";
import { useSidebarState } from "./@sidebar/SidebarState";
import { useGesture } from "@use-gesture/react";
export function LayoutWrapper(props: {
  id: string;
  children: React.ReactNode;
  className: string;
}) {
  let viewheight = useViewportSize().height;
  let difference = useViewportDifference();
  let heightSpring = useSpring({
    height: viewheight,
  });
  let { active } = useDndContext();
  let { setSidebar } = useSidebarState();
  let bind = useGesture(
    {
      onDrag: (data) => {
        if (
          (data.currentTarget as HTMLElement)?.scrollLeft === 0 &&
          data.direction[0] > 0 &&
          data.distance[0] > 8 &&
          data.distance[1] < 8
        ) {
          if (active?.data) return;
          setSidebar(true);
        }
      },
    },
    { drag: { pointer: { keys: false } } }
  );
  return (
    <animated.div
      id={props.id}
      style={
        isIOS()
          ? difference > 10
            ? heightSpring
            : undefined
          : { height: "100%" }
      }
      className={props.className}
      {...bind()}
    >
      {props.children}
    </animated.div>
  );
}
