import { create } from "zustand";
import { combine } from "zustand/middleware";
export const useSidebarState = create(
  combine(
    {
      open: false,
      hidden: true,
    },
    (set) => ({
      setSidebarHidden: (hidden: boolean) => set(() => ({ hidden: hidden })),
      toggleSidebar: () => set((oldState) => ({ open: !oldState.open })),
      setSidebar: (open: boolean) => set(() => ({ open: open })),
    })
  )
);
