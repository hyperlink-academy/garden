"use client";
import { animated, useSpring } from "@react-spring/web";
import { DisclosureExpandTiny } from "components/Icons";
import { useIsClient, useIsMobile } from "hooks/utils";
import { useEffect } from "react";
import { useDroppableZone } from "components/DragContext";
import { useGesture } from "@use-gesture/react";
import { useSidebarState } from "./SidebarState";
import { Divider } from "components/Layout";

export default function SidebarLayout(props: {
  breadcrumb: React.ReactNode;
  header: React.ReactNode;
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
        className={`sidebarWrapper lightBorder no-scrollbar relative  z-50 flex shrink-0 overflow-x-hidden overflow-y-scroll text-left ${
          open && "cursor-default"
        } ${isMobile && !open ? "bg-bg-blue" : "bg-white"}`}
        onClick={() => setSidebar(true)}
      >
        <animated.div
          style={sidebarSpring}
          className="no-scrollbar h-full w-full overflow-x-hidden"
        >
          <div className="sidebar flex h-full flex-col items-stretch gap-0 relative overflow-y-scroll w-full justify-items-start justify-start">
            <div className={`top-0 sticky bg-white z-10 ${open ? "w-64" : ""}`}>
              {isMobile && !open ? (
                <div className="sidebarMobileCollapsed  text-grey-55 mt-1 flex w-3 origin-center -rotate-90">
                  <DisclosureExpandTiny />
                </div>
              ) : (
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

              {open && (
                <>
                  {props.header}
                  <div className="divider shrink-0 pt-3">
                    <Divider />
                  </div>
                </>
              )}
            </div>

            {open ? (
              <div className="h-full w-64 pt-3">{props.children}</div>
            ) : !isMobile ? (
              <div className="sidebarCollapsed px-1 flex h-full w-max flex-col pt-3">
                {props.children}
              </div>
            ) : null}
          </div>
        </animated.div>
      </div>
    </>
  );
}
