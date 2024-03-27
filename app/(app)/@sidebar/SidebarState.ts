import { create } from "zustand";
import { combine } from "zustand/middleware";
export const useSidebarState = create(
  combine(
    {
      open: false,
    },
    (set) => ({
      toggleSidebar: () => set((oldState) => ({ open: !oldState.open })),
      setSidebar: (open: boolean) => set({ open: open }),
    })
  )
);
