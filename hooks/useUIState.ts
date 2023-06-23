import { create } from "zustand";
import { combine } from "zustand/middleware";

export let useUIState = create(
  combine(
    {
      focusedCard: undefined as string | undefined,
    },
    (set) => ({
      setFocusedCard: (entityID: string | undefined) =>
        set({ focusedCard: entityID }),
    })
  )
);
