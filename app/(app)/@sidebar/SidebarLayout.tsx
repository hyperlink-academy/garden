"use client";
import { animated, useSpring } from "@react-spring/web";
import { DisclosureExpandTiny } from "components/Icons";
import { useIsClient, useIsMobile } from "hooks/utils";
import { useEffect } from "react";
import { useDroppableZone } from "components/DragContext";
import { useGesture } from "@use-gesture/react";
import { useSidebarState } from "./SidebarState";
import { Divider } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import Link from "next/link";

export default function SidebarLayout(props: {
  breadcrumb: React.ReactNode;
  header: React.ReactNode;
  openContent: React.ReactNode;
  headerContent: React.ReactNode;
  collapsedContent: React.ReactNode;
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

  let disclosureSpring = useSpring({
    rotate: open ? 90 : -90,
  });
  let sidebarOverlaySpring = useSpring({
    opacity: open ? 0.2 : 0,
  });
  useEffect(() => {
    let listener = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        setSidebar(true);
        setTimeout(() => {
          document.getElementById("sidebar-search")?.focus();
        }, 10);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [setSidebar]);

  if (!isClient) return;
  if (isMobile)
    return (
      <>
        <div className="mobileHeaderWrapper absolute left-0 top-0 z-30 w-full bg-background">
          <div
            className={`mobileHeader w-full border-b border-grey-90 bg-background px-2 pb-1 ${"pwa-padding"}`}
          >
            <div className="no-scrollbar relative flex flex-row gap-1 overflow-x-scroll">
              <button
                className="mobileHeaderToggle sticky left-0 z-20 shrink-0 bg-background  pr-1 text-grey-55"
                onClick={() => {
                  useSidebarState.getState().toggleSidebar();
                }}
              >
                <DisclosureExpandTiny className="-rotate-90 " />
              </button>
              {props.headerContent}
            </div>
          </div>
        </div>
        {open && (
          <animated.div
            {...bindOverlay()}
            onClick={() => setSidebar(false)}
            className="absolute inset-0 z-30 touch-none bg-grey-15"
            style={{
              ...sidebarOverlaySpring,
              display: open ? "block" : "none",
            }}
          >
            <div className="z-20 ml-auto h-full w-2/3" ref={droppableRef} />
          </animated.div>
        )}
        <div
          style={{
            left: open ? 0 : -262,
          }}
          className={`pwa-padding pwa-padding-bottom absolute top-0 z-30 flex h-full py-1 pl-1`}
        >
          <div
            {...bindSidebar()}
            ref={setNodeRef}
            className={`sidebarWrapper lightBorder no-scrollbar relative z-50  flex shrink-0 cursor-default touch-none overflow-x-hidden overflow-y-scroll bg-white text-left`}
            onClick={() => setSidebar(true)}
          >
            <div className="sidebar relative flex h-full w-full flex-col items-stretch justify-start justify-items-start gap-0 overflow-y-scroll bg-inherit no-scrollbar">
              <div className={`sticky top-0 z-10 w-64 bg-inherit`}>
                <div className="flex items-center justify-between px-3 pt-2">
                  <Breadcrumbs breadcrumb={props.breadcrumb} />
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
                {props.header}
                <div className="divider shrink-0 pt-3">
                  <Divider />
                </div>
              </div>
              <div className="h-full w-64 pt-3">{props.openContent}</div>
            </div>
          </div>
        </div>
      </>
    );

  return (
    <>
      <div
        {...bindSidebar()}
        ref={setNodeRef}
        className={`sidebarWrapper lightBorder no-scrollbar relative z-50  flex shrink-0 touch-none overflow-x-hidden overflow-y-scroll text-left ${
          open && "cursor-default"
        } ${open ? "bg-white" : "bg-bg-blue"}`}
        onClick={() => setSidebar(true)}
      >
        <div
          style={{
            width: isMobile || open ? 256 : 36,
          }}
          className="no-scrollbar h-full w-full overflow-x-hidden bg-inherit"
        >
          <div className="sidebar relative flex h-full w-full flex-col items-stretch justify-start justify-items-start gap-0 overflow-y-scroll bg-inherit no-scrollbar">
            <div
              className={`sticky top-0 z-10 bg-inherit ${open ? "w-64" : ""}`}
            >
              {
                <div className="flex items-center justify-between px-3 pt-2">
                  {open && <Breadcrumbs breadcrumb={props.breadcrumb} />}
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
              }

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
              <div className="h-full w-64 pt-3">{props.openContent}</div>
            ) : (
              <div className="sidebarCollapsed flex h-full w-max flex-col px-1 pt-3">
                {props.collapsedContent}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Breadcrumbs(props: { breadcrumb: React.ReactNode }) {
  let { session } = useAuth();
  let { setSidebar } = useSidebarState();
  let isMobile = useIsMobile();
  return (
    <div className="flex flex-row gap-1">
      <Link
        onClick={(e) => {
          e.stopPropagation();
          if (isMobile) setSidebar(false);
        }}
        className="sidebarBreadcrumb flex shrink-0 flex-row items-center text-sm text-grey-55"
        href={session.session ? `/s/${session.session.username}` : "/"}
      >
        <div className="flex gap-1">
          <div className="font-bold hover:text-accent-blue">h</div>
          <div className="font-bold">/</div>
        </div>
      </Link>
      {props.breadcrumb}
    </div>
  );
}
