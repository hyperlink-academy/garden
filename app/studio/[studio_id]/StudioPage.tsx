"use client";

import { Tab } from "@headlessui/react";
import { NonUndefined } from "@use-gesture/react";
import { useStudioData } from "hooks/useStudioData";
import { Fragment, useEffect, useState } from "react";
import { Members } from "./MemberTab";
import { StudioSettings } from "./SettingsTab";
import { SpaceList } from "./SpacesTab";
import { About } from "./AboutTab";
import { ArrowDown, ArrowUp } from "components/Icons";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
  isAdmin: boolean;
};

const Tabs = { About: About, Spaces: SpaceList, Members: Members } as {
  [key: string]: (props: Props) => React.ReactNode;
};
export function StudioPageContent(props: Props) {
  let tab = "About";
  let { data } = useStudioData(props.data?.id, props.data);
  let [selectedIndex, setSelectedIndex] = useState(0);
  let { session } = useAuth();

  if (props.isAdmin) Tabs["Settings"] = Settings;

  useEffect(() => {
    setSelectedIndex(() => {
      return tab ? Object.keys(Tabs).indexOf(tab as string) : 0;
    });
  }, [tab]);

  return (
    <div className="Studio flex h-screen w-full items-stretch">
      <div className="StudioHeader m-auto flex h-full w-full max-w-6xl flex-col gap-1 px-4 pb-6 pt-8">
        <div className="relative w-full text-center ">
          <h2>{data?.name}</h2>
          {session.session && (
            <Link
              href={`/s/${session.session.username}`}
              className="absolute left-0 top-[6px] flex h-full items-center gap-2 text-grey-55 hover:text-accent-blue"
            >
              <ArrowDown className="rotate-90" height={16} width={16} /> home
            </Link>
          )}
        </div>
        <Tab.Group
          manual
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
        >
          <div className="StudioContent flex h-full flex-col gap-4 overflow-hidden">
            <Tab.List className="StudioTabs flex w-full shrink-0 flex-row justify-center gap-4">
              {Object.keys(Tabs).map((tab) => (
                <TabItem
                  name={
                    tab === "Members"
                      ? `Members (${data?.members_in_studios.length})`
                      : tab
                  }
                  key={tab}
                />
              ))}
            </Tab.List>
            <Tab.Panels className="StudioTabContent h-full min-h-0 ">
              {Object.values(Tabs).map((T, index) => (
                <Tab.Panel key={index} className="h-full">
                  <T data={data || props.data} isAdmin={props.isAdmin} />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </div>
        </Tab.Group>
      </div>
    </div>
  );
}

const TabItem = (props: { name: string }) => (
  <Tab as={Fragment}>
    {({ selected }) => (
      <button
        className={`outline-none ${
          selected
            ? "font-bold text-accent-blue"
            : "text-grey-35 hover:text-accent-blue"
        }`}
      >
        {props.name}
      </button>
    )}
  </Tab>
);

function Settings({ data }: Props) {
  return (
    <>
      <StudioSettings id={data.id} />
    </>
  );
}
