"use client";
import { animated, useSpring } from "@react-spring/web";
import { DisclosureExpandTiny } from "components/Icons";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useIsClient, useIsMobile } from "hooks/utils";
import { useEffect } from "react";
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
  let isClient = useIsClient();
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
    width: open ? 256 : isMobile ? 12 : 36,
  });
  let disclosureSpring = useSpring({
    rotate: open ? 90 : -90,
  });
  let sidebarOverlaySpring = useSpring({
    opacity: open ? 0.2 : 0,
  });

  if (!isClient) return;

  return (
    <>
      {isMobile && open && (
        <animated.div
          {...bindOverlay()}
          onClick={() => setSidebar(false)}
          className="bg-grey-15 fixed inset-0 z-20 touch-none"
          style={{ ...sidebarOverlaySpring, display: open ? "block" : "none" }}
        >
          <div className="z-20 ml-auto h-full w-2/3" ref={droppableRef} />
        </animated.div>
      )}
      <div
        {...bindSidebar()}
        ref={setNodeRef}
        className={`sidebarWrapper lightBorder no-scrollbar relative  z-50 flex shrink-0 items-stretch overflow-x-hidden overflow-y-scroll text-left ${
          open && "cursor-default"
        } ${isMobile && !open ? "bg-bg-blue" : "bg-white"}`}
        onClick={() => setSidebar(true)}
      >
        <animated.div
          style={sidebarSpring}
          className="no-scrollbar h-full w-full overflow-x-hidden"
        >
          <div className="sidebar flex h-full flex-col items-stretch gap-0">
            {!isMobile && (
              <div className="flex items-center justify-between px-3 pt-3">
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
            )}

            {open ? (
              <div className="h-full w-64">{props.children}</div>
            ) : !isMobile ? (
              <div className="sidebarCollapsed mx-auto flex h-full w-max flex-col pt-3">
                {props.children}
              </div>
            ) : (
              <div className="sidebarMobileCollapsed  text-grey-55 mt-1 flex w-3 origin-center -rotate-90">
                <DisclosureExpandTiny />
              </div>
            )}
          </div>
        </animated.div>
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
    <div className={props.className} {...bind()}>
      {props.children}
    </div>
  );
}
