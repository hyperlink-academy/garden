"use client";

import { NonUndefined } from "@use-gesture/react";
import { useStudioData } from "hooks/useStudioData";
import { useCallback, useEffect, useState } from "react";
import { Members } from "./MemberTab";
import { StudioSettings } from "./SettingsTab";
import { SpaceList } from "./SpacesTab";
import { About } from "./AboutTab";
import { GoBackToPageLined, Information } from "components/Icons";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { ButtonPrimary } from "components/Buttons";
import { LoginButton, LoginOrSignupModal } from "components/LoginModal";
import * as Popover from "@radix-ui/react-popover";
import { joinCodeLocalStorageKey } from "./join/Join";
import { spaceAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { useSearchParams } from "next/navigation";
import { useToaster } from "components/Smoke";
import { uuidToBase62 } from "src/uuidHelpers";

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
    <div className="pwa-padding studioWrapper  flex w-full items-stretch px-3 sm:h-screen sm:px-4">
      <div className="flex w-full flex-col">
        <div
          className={`StudioContent flex w-full grow flex-col items-stretch`}
        >
          <div className="no-scrollbar h-full w-full overflow-y-scroll">
            <TabPanels
              data={data || props.data}
              isAdmin={props.isAdmin}
              setTab={setTab}
              currentTab={currentTab}
            />
          </div>
        </div>
      </div>
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
