"use client";

import { Tab } from "@headlessui/react";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { Textarea } from "components/Textarea";
import { useAuth } from "hooks/useAuth";
import { NonUndefined } from "@use-gesture/react";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { Members } from "./MemberTab";
import { StudioSettings } from "./SettingsTab";
import { SpaceList } from "./SpacesTab";
import { About } from "./AboutTab";

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

  if (props.isAdmin) Tabs["Settings"] = Settings;

  useEffect(() => {
    setSelectedIndex(() => {
      return tab ? Object.keys(Tabs).indexOf(tab as string) : 0;
    });
  }, [tab]);

  return (
    <div className="m-auto flex h-full w-full max-w-6xl flex-col items-stretch gap-2 px-4 pt-2">
      <div className="w-full text-center">
        <h1>{data?.name}</h1>
      </div>
      <Tab.Group
        manual
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
      >
        <Tab.List className="flex w-full flex-row justify-center gap-4">
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
        <Tab.Panels>
          {Object.values(Tabs).map((T, index) => (
            <Tab.Panel key={index}>
              <T data={data || props.data} isAdmin={props.isAdmin} />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
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

const List = (props: { spaces: Array<SpaceData> }) => {
  let params = useParams<{ studio_id: string }>();

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {props.spaces.map((space) => {
          return (
            <div className="" key={space.id}>
              <Link
                href={`/studio/${params?.studio_id}/space/${space.id}`}
                className="flex flex-col gap-2 text-left"
              >
                <BaseSpaceCard {...space} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function Settings({ data }: Props) {
  return (
    <>
      <StudioSettings id={data.id} />
    </>
  );
}
