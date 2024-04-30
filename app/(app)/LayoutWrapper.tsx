"use client";
import { useDndContext } from "@dnd-kit/core";
import { isIOS, useViewportSize } from "@react-aria/utils";
import { useViewportDifference } from "hooks/useViewportSize";
import { useSidebarState } from "./@sidebar/SidebarState";
import { useGesture } from "@use-gesture/react";
import { useEffect } from "react";
import { usePreventScroll } from "@react-aria/overlays";

export function LayoutWrapper(props: {
  id: string;
  children: React.ReactNode;
  className: string;
}) {
  let viewheight = useViewportSize().height;
  let difference = useViewportDifference();

  usePreventScroll();
  return (
    <div
      id={props.id}
      style={
        !isIOS()
          ? undefined
          : difference === 0
          ? undefined
          : { height: viewheight }
      }
      className={props.className}
    >
      {props.children}
    </div>
  );
}

export function SideScrollSidebarHandler(props: {
  className: string;
  children: React.ReactNode;
  id: string;
}) {
  let { active } = useDndContext();
  let { setSidebar, toggleSidebar } = useSidebarState();
  let bind = useGesture(
    {
      onDrag: (data) => {
        if ((data.event as PointerEvent)?.pointerType === "mouse") return;
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
  useEffect(() => {
    let listener = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) toggleSidebar();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [toggleSidebar]);
  return (
    <div id={props.id} className={props.className} {...bind()}>
      {props.children}
    </div>
  );
}
