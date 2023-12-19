"use client";

import { Tab } from "@headlessui/react";
import { ButtonPrimary } from "components/Buttons";
import { MemberAdd } from "components/Icons";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { Textarea } from "components/Textarea";
import { db, useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

type Props = {
  data: ReturnType<typeof useStudioData>["data"];
  isAdmin: boolean;
};

export function StudioPageContent({ data, isAdmin }: Props) {
  let tab = "About";
  let [selectedIndex, setSelectedIndex] = useState(0);

  const Tabs = { About: About, Spaces: SpaceList, Members: Members };
  if (isAdmin) Tabs["Settings"] = Settings;

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
              <T data={data} isAdmin={isAdmin} />
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

function SpaceList({ data }: Props) {
  let [search, setSearch] = useState("");

  let spaces = data?.spaces_in_studios.filter(
    ({ space_data: s }) =>
      s && !s.archived && s.display_name?.toLocaleLowerCase().includes(search)
  );

  if (!data) return;
  return (
    <div className="m-auto flex h-full w-full max-w-6xl flex-col items-stretch gap-2">
      <div className="flex w-full flex-row justify-between ">
        <AddSpace id={data.id} />
        <div className="flex flex-row ">
          <input
            className="w-64"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
      </div>
      <div className="no-scrollbar relative flex h-full w-full flex-row gap-2 overflow-y-scroll ">
        <List spaces={spaces?.map((s) => s.space_data as SpaceData) || []} />
      </div>
    </div>
  );
}

function About() {
  let home = db.useAttribute("home")[0];
  let homeContent = db.useEntity(home?.entity, "card/content");
  let { mutate } = useMutations();
  return (
    <div className="h-full rounded-lg border border-grey-80 bg-white p-4">
      {
        <Textarea
          className="h-full"
          placeholder="write a readme..."
          value={homeContent?.value}
          onChange={(e) => {
            if (!home) return;
            mutate("assertFact", {
              positions: {},
              attribute: "card/content",
              value: e.currentTarget.value,
              entity: home?.entity,
            });
          }}
        />
      }
    </div>
  );
}

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

function Members({ data, isAdmin }: Props) {
  return (
    <>
      {isAdmin && (
        <div className="lightBorder m-auto flex max-w-2xl flex-row items-center justify-between bg-bg-blue p-2 text-grey-55">
          Add a new member!{" "}
          <ButtonPrimary icon={<MemberAdd />} content="Invite" />
        </div>
      )}

      {data?.members_in_studios.map((m) => (
        <div key={m.member}>{m.identity_data?.username}</div>
      ))}
    </>
  );
}

function Settings({ data }: Props) {
  return (
    <>
      <div>settings yo</div>
    </>
  );
}
