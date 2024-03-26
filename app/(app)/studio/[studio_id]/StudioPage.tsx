"use client";

import { NonUndefined } from "@use-gesture/react";
import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { Members } from "./MemberTab";
import { StudioSettings } from "./SettingsTab";
import { SpaceList } from "./SpacesTab";
import { About } from "./AboutTab";
import { useAuth } from "hooks/useAuth";

import { GetStartedTab, useHasGetStartedItems } from "./GettingStartedTab";
import { useStudioTabs } from "app/(app)/@sidebar/studio/[studio_id]/StudioTabs";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
  isAdmin: boolean;
};

export type Tabs = "About" | "Spaces" | "Members" | "Settings" | "Get Started";

const TabPanels = (
  props: Props & { setTab: (t: Tabs) => void; currentTab: Tabs }
) => {
  let hasGetStartedItems = useHasGetStartedItems(props);
  switch (props.currentTab) {
    case "Get Started":
      return hasGetStartedItems ? <GetStartedTab {...props} /> : null;
    case "About":
      return <About {...props} />;
    case "Members":
      return <Members {...props} />;
    case "Settings":
      return props.isAdmin ? <Settings {...props} /> : null;
    case "Spaces":
      return <SpaceList {...props} />;
  }
};

export function StudioPageContent(props: Props) {
  let { data } = useStudioData(props.data?.id, props.data);
  let { session } = useAuth();
  let authorized = data?.members_in_studios.find(
    (m) => m.member === session.user?.id
  );
  let [currentTab, setTab] = useStudioTabs(props.data.id);

  let hasGettingStartedItems = useHasGetStartedItems(props);
  useEffect(() => {
    if (currentTab) return;
    setTab(
      hasGettingStartedItems
        ? "Get Started"
        : session.session && authorized
        ? "Spaces"
        : "About"
    );
  }, [
    currentTab,
    hasGettingStartedItems,
    session,
    authorized,
    props.data.id,
    setTab,
  ]);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;
  return (
    <div
      className={`pwa-padding studioWrapper min-w-[min(calc(100vw-128px),56rem)] max-w-4xl flex-col  items-stretch sm:mt-2  sm:pl-0 ${
        currentTab === "About" ? "h-full" : "h-fit"
      }`}
    >
      <TabPanels
        data={data || props.data}
        isAdmin={props.isAdmin}
        setTab={setTab}
        currentTab={currentTab}
      />
    </div>
  );
}

function Settings({ data }: Props) {
  return (
    <>
      <StudioSettings id={data.id} />
    </>
  );
}
