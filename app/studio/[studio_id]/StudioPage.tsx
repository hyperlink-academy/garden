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
  let { data } = useStudioData(props.data?.id, props.data);
  let [selectedIndex, setSelectedIndex] = useState(0);
  let { session } = useAuth();

  if (props.isAdmin) Tabs["Settings"] = Settings;

  return (
    <div className="studioWrapper items-stretchpx-4 flex h-screen w-full">
      <div className="studio m-auto flex h-full w-full max-w-6xl gap-4 px-4">
        <Tab.Group
          manual
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
        >
          {/* <div className="relative w-full text-center">
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
          <Tab.List className="StudioTabs flex w-full shrink-0 flex-row justify-center gap-4 pb-4">
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
          </Tab.List> */}

          <div className="studioNav my-6 w-64 flex-col justify-between border-r border-grey-80 pr-4">
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
                  <ArrowDown className="rotate-90" height={16} width={16} />{" "}
                  home
                </Link>
              )}
            </div>
          </div>

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
