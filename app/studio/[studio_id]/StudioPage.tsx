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
import useWindowDimensions from "hooks/useWindowDimensions";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
  isAdmin: boolean;
};

const Tabs = { About: About, Spaces: SpaceList, Members: Members } as {
  [key: string]: (props: Props) => React.ReactNode;
};
export function StudioPageContent(props: Props) {
  let { data } = useStudioData(props.data?.id, props.data);
  let [selectedIndex, setSelectedIndex] = useState(0);
  let { session } = useAuth();
  let { width } = useWindowDimensions();

  if (props.isAdmin) Tabs["Settings"] = Settings;

  return (
    <div className="studioWrapper flex w-full items-stretch px-3 sm:h-screen sm:px-4">
      <div className="studio relative m-auto flex h-full w-full max-w-6xl flex-col sm:flex-row">
        <Tab.Group
          manual
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
        >
          {width > 640 ? (
            <StudioDesktopNav data={props.data} isAdmin={props.isAdmin} />
          ) : (
            <StudioMobileNav data={props.data} isAdmin={props.isAdmin} />
          )}

          <div
            className={`StudioContent flex w-full grow flex-col items-stretch`}
          >
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
        className={`text-right outline-none ${
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

const StudioDesktopNav = (props: Props) => {
  let { data } = useStudioData(props.data?.id, props.data);
  let { session } = useAuth();

  return (
    <div className="studioNav my-6 mr-4 w-64 flex-col justify-between border-r border-grey-80 pr-4">
      <div className="flex w-full flex-col gap-2 text-right">
        <h3>{data?.name}</h3>
        <Tab.List className="StudioTabs flex flex-col gap-2 ">
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
        {session.session && (
          <Link
            href={`/s/${session.session.username}`}
            className="flex items-center justify-end gap-2 text-grey-55 hover:text-accent-blue"
          >
            <ArrowDown className="rotate-90" height={16} width={16} /> home
          </Link>
        )}
      </div>
    </div>
  );
};

const StudioMobileNav = (props: Props) => {
  let { data } = useStudioData(props.data?.id, props.data);
  let { session } = useAuth();

  return (
    <>
      {session.session && (
        <Link
          href={`/s/${session.session.username}`}
          className="mt-3 flex items-center gap-2 text-sm text-grey-55 hover:text-accent-blue"
        >
          <ArrowDown className="rotate-90" height={16} width={16} /> home
        </Link>
      )}
      <h3 className="z-20 -mb-3 mt-2">{data?.name}</h3>
      <div className="sticky top-0 z-10 -mx-3 mb-4 border-b border-grey-80 bg-background px-3  pb-1 pt-4">
        <div className=" flex gap-2 ">
          <Tab.List className="StudioTabs  flex gap-4">
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
        </div>
      </div>
    </>
  );
};
