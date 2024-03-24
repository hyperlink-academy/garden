import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";
export const useSidebarState = create(
  combine(
    {
      open: false,
      hidden: true,
      title: null as React.ReactNode,
    },
    (set) => ({
      setSidebarHidden: (hidden: boolean) => set(() => ({ hidden: hidden })),
      toggleSidebar: () => set((oldState) => ({ open: !oldState.open })),
      setSidebar: (open: boolean) => set(() => ({ open: open })),
    })
  )
);

export function useSetSidebarTitle(cb: () => React.ReactNode, deps: any[]) {
  let callback = useCallback(cb, deps);
  useEffect(() => {
    useSidebarState.setState({ title: callback() });
  }, [callback]);
}
