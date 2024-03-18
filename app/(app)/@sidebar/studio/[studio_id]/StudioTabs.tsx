"use client";
import { Props } from "app/(app)/studio/[studio_id]/StudioPage";
import { useHasGetStartedItems } from "app/(app)/studio/[studio_id]/GettingStartedTab";
import {
  RoomAbout,
  RoomGetStarted,
  RoomMember,
  RoomSettings,
  RoomSpaces,
} from "components/Icons";
import { useCallback } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SidebarTab } from "../../SidebarTab";

export type Tab = "About" | "Spaces" | "Members" | "Settings" | "Get Started";
export const useStudioTabsState = create(
  persist<{
    studio: { [studio_id: string]: { tab: Tab } };
    setTab: (studio_id: string, tab: Tab) => void;
  }>(
    (set, get) => ({
      studio: {},
      setTab: (studio_id: string, tab: Tab) => {
        return set({ studio: { ...get().studio, [studio_id]: { tab } } });
      },
    }),
    {
      name: "studio-tabs",
      storage: createJSONStorage(() => window.sessionStorage),
    }
  )
);

export const useStudioTabs = (studio_id: string) => {
  const tab = useStudioTabsState((s) => s.studio[studio_id]?.tab);
  let set = useStudioTabsState((s) => s.setTab);
  let setTab = useCallback(
    (tab: Tab) => {
      set(studio_id, tab);
    },
    [studio_id, set]
  );
  return [tab, setTab] as const;
};

export const TabsList = (
  props: Props & {
    isAdmin: boolean;
    className: string;
    collapsed: boolean;
  }
) => {
  let hasGetStartedItems = useHasGetStartedItems(props);
  let [currentTab, setTab] = useStudioTabs(props.data.id);
  return (
    <div className={props.className}>
      {hasGetStartedItems ? (
        <TabItem
          collapsed={props.collapsed}
          icon={<RoomGetStarted />}
          name="Get Started"
          setTab={setTab}
          id="Get Started"
          currentTab={currentTab}
        />
      ) : null}
      <TabItem
        collapsed={props.collapsed}
        icon={<RoomAbout />}
        name="About"
        setTab={setTab}
        id="About"
        currentTab={currentTab}
      />
      <TabItem
        collapsed={props.collapsed}
        icon={<RoomSpaces />}
        name="Spaces"
        setTab={setTab}
        id="Spaces"
        currentTab={currentTab}
      />
      <TabItem
        collapsed={props.collapsed}
        icon={<RoomMember />}
        name="Members"
        setTab={setTab}
        id="Members"
        currentTab={currentTab}
      />
      {props.isAdmin ? (
        <TabItem
          collapsed={props.collapsed}
          icon={<RoomSettings />}
          name="Settings"
          setTab={setTab}
          id="Settings"
          currentTab={currentTab}
        />
      ) : null}
    </div>
  );
};

const TabItem = (props: {
  name: string;
  icon: React.ReactNode;
  id: Tab;
  currentTab: Tab;
  collapsed: boolean;
  setTab: (t: Tab) => void;
}) => (
  <SidebarTab
    collapsed={props.collapsed}
    title={props.name}
    icon={props.icon}
    active={props.currentTab === props.id}
    onClick={() => props.setTab(props.id)}
  />
);
