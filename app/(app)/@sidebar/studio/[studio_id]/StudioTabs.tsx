"use client";
import { Props } from "app/(app)/studio/[studio_id]/StudioPage";
import { useHasGetStartedItems } from "app/(app)/studio/[studio_id]/GettingStartedTab";
import { Settings as SettingsIcon } from "components/Icons";
import { useCallback } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Tab = "About" | "Spaces" | "Members" | "Settings" | "Get Started";
export const useStudioTabsState = create(
  persist<{
    studio: { [studio_id: string]: { tab: Tab } };
    setTab: (studio_id: string, tab: Tab) => void;
  }>(
    (set, get) => ({
      studio: {},
      setTab: (studio_id: string, tab: Tab) => {
        console.log("yooo");
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
  }
) => {
  let hasGetStartedItems = useHasGetStartedItems(props);
  let [currentTab, setTab] = useStudioTabs(props.data.id);
  return (
    <div className={props.className}>
      {hasGetStartedItems ? (
        <TabItem
          name="Get Started"
          setTab={setTab}
          id="Get Started"
          currentTab={currentTab}
        />
      ) : null}
      <TabItem
        name="About"
        setTab={setTab}
        id="About"
        currentTab={currentTab}
      />
      <TabItem
        name="Spaces"
        setTab={setTab}
        id="Spaces"
        currentTab={currentTab}
      />
      <TabItem
        name="Members"
        setTab={setTab}
        id="Members"
        currentTab={currentTab}
      />
      {props.isAdmin ? (
        <TabItem
          name={<SettingsIcon />}
          setTab={setTab}
          id="Settings"
          currentTab={currentTab}
        />
      ) : null}
    </div>
  );
};

const TabItem = (props: {
  name: React.ReactNode;
  id: Tab;
  currentTab: Tab;
  setTab: (t: Tab) => void;
}) => (
  <button
    onClick={() => props.setTab(props.id)}
    className={`text-left ${
      props.currentTab === props.id
        ? "text-accent-blue font-bold"
        : "text-grey-35 hover:text-accent-blue"
    }`}
  >
    {props.name}
  </button>
);
