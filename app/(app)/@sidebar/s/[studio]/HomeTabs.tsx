"use client";

import { useAuth } from "hooks/useAuth";
import { useCallback } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SidebarTab } from "../../SidebarTab";
import { RoomSettings, RoomStudios } from "components/Icons";

export type Tab = "Home" | "Settings";
export const useHomeTabsState = create(
  persist<{
    home: { [studio_id: string]: { tab: Tab } };
    setTab: (studio_id: string, tab: Tab) => void;
  }>(
    (set, get) => ({
      home: {},
      setTab: (username: string, tab: Tab) => {
        return set({ home: { ...get().home, [username]: { tab } } });
      },
    }),
    {
      name: "studio-tabs",
      storage: createJSONStorage(() => window.sessionStorage),
    }
  )
);

export const useHomeTabs = (username: string) => {
  const tab = useHomeTabsState((s) => s.home[username]?.tab) || "Home";
  let set = useHomeTabsState((s) => s.setTab);
  let setTab = useCallback(
    (tab: Tab) => {
      set(username, tab);
    },
    [username, set]
  );
  return [tab, setTab] as const;
};

export const HomeTabs = (props: { username: string }) => {
  let { session } = useAuth();
  let [tab, setTab] = useHomeTabs(props.username);
  return (
    <div className="flex flex-col gap-0.5 px-3">
      <SidebarTab
        title="Home"
        icon=<RoomStudios />
        active={tab === "Home"}
        onClick={() => setTab("Home")}
      />
      {session?.session?.username === props.username && (
        <SidebarTab
          title="Settings"
          icon=<RoomSettings />
          active={tab === "Settings"}
          onClick={() => setTab("Settings")}
        />
      )}
    </div>
  );
};
