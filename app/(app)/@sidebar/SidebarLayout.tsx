import { animated, useSpring } from "@react-spring/web";
import { DisclosureExpandTiny } from "components/Icons";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useIsMobile } from "hooks/utils";

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
  let { open, toggleSidebar } = useSidebarState((state) => state);
  let isMobile = useIsMobile();

  let sidebarSpring = useSpring({
    width: open ? 256 : isMobile ? 16 : 36,
  });
  let disclosureSpring = useSpring({
    rotate: open ? 90 : -90,
  });

  return (
    <div className="lightBorder z-30 flex shrink-0 flex-col overflow-hidden bg-white">
      <div className="h-full w-full overflow-x-hidden  py-3 ">
        <animated.div style={sidebarSpring}>
          <div className="sidebar flex h-full flex-col items-stretch gap-0">
            <div className="flex items-center justify-between px-3">
              {open && props.breadcrumb}
              <animated.div style={disclosureSpring}>
                <button
                  className="text-grey-55 hover:text-accent-blue "
                  onClick={() => toggleSidebar()}
                >
                  <DisclosureExpandTiny />
                </button>
              </animated.div>
            </div>
            {open ? (
              <div className="w-64">{props.children}</div>
            ) : (
              <div className="sidebarHomeCollapsed flex w-max flex-col justify-center px-1 pt-3">
                {props.children}
              </div>
            )}
          </div>
        </animated.div>
      </div>
    </div>
  );
}
