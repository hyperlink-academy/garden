"use client";
import { animated, useSpring } from "@react-spring/web";
import { DisclosureExpandTiny } from "components/Icons";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useIsMobile } from "hooks/utils";
import { useEffect, useState } from "react";
import { useDroppableZone } from "components/DragContext";
import { useGesture } from "@use-gesture/react";
import { useDndContext } from "@dnd-kit/core";

export const useSidebarState = create(
  combine(
    {
      open: false,
    },
    (set) => ({
      toggleSidebar: () => set((oldState) => ({ open: !oldState.open })),
      setSidebar: (open: boolean) => set(() => ({ open: open })),
    })
  )
);

export default function SidebarLayout(props: {
  breadcrumb: React.ReactNode;
  children: React.ReactNode;
}) {
  let { open, toggleSidebar, setSidebar } = useSidebarState((state) => state);
  let isMobile = useIsMobile();
  let { setNodeRef, over } = useDroppableZone({
    type: "trigger",
    id: "mobile-sidebar",
    entityID: "mobile-sidebar",
  });

  useEffect(() => {
    if (over?.type === "room" || !over) return;
    let timeout = window.setTimeout(() => {
      setSidebar(true);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [over, setSidebar]);

  let { setNodeRef: droppableRef, over: overOverlay } = useDroppableZone({
    type: "trigger",
    id: "mobile-sidebar-overlay",
    entityID: "mobile-sidebar-overlay",
  });

  useEffect(() => {
    if (overOverlay?.type === "room" || !overOverlay) return;
    let timeout = window.setTimeout(() => {
      setSidebar(false);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [overOverlay, setSidebar]);

  const bindOverlay = useGesture({
    onDrag: (data) => {
      if (data.direction[0] < 0) {
        setSidebar(false);
      }
    },
  });

  const bindSidebar = useGesture({
    onDragEnd: (data) => {
      if (
        data.direction[0] < 0 &&
        data.velocity[0] > 0.1 &&
        data.velocity[1] < 0.5
      ) {
        setSidebar(false);
      }
    },
  });

  let sidebarSpring = useSpring({
    width: open ? 256 : isMobile ? 16 : 36,
  });
  let disclosureSpring = useSpring({
    rotate: open ? 90 : -90,
  });
  let sidebarOverlaySpring = useSpring({
    opacity: open ? 0.2 : 0,
  });

  return (
    <>
      {isMobile && (
        <animated.div
          {...bindOverlay()}
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-40 touch-none bg-grey-15"
          style={{ ...sidebarOverlaySpring, display: open ? "block" : "none" }}
        >
          <div className="z-40 ml-auto h-full w-2/3" ref={droppableRef} />
        </animated.div>
      )}
      <div
        {...bindSidebar()}
        ref={setNodeRef}
        className={`lightBorder z-50 flex shrink-0 flex-col overflow-hidden bg-white text-left ${
          open && "cursor-default"
        }`}
        onClick={() => setSidebar(true)}
      >
        <div className="no-scrollbar h-full w-full overflow-x-hidden  py-3 ">
          <animated.div style={sidebarSpring}>
            <div className="sidebar flex h-full flex-col items-stretch gap-0">
              <div className="flex items-center justify-between px-3">
                {open && props.breadcrumb}
                <animated.div style={disclosureSpring}>
                  <button
                    className="text-grey-55 hover:text-accent-blue "
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSidebar();
                    }}
                  >
                    <DisclosureExpandTiny />
                  </button>
                </animated.div>
              </div>
              {open ? (
                <div className="w-64">{props.children}</div>
              ) : (
                <div className="sidebarCollapsed flex w-max flex-col justify-center px-1 pt-3">
                  {props.children}
                </div>
              )}
            </div>
          </animated.div>
        </div>
      </div>
    </>
  );
}

export function OpenSidebarOnSwipe(props: {
  children: React.ReactNode;
  className: string;
}) {
  let { active } = useDndContext();
  let { setSidebar } = useSidebarState();
  let bind = useGesture({
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
  });
  return (
    <div className={props.className} {...bind()}>
      {props.children}
    </div>
  );
}
