import { animated, useSpring } from "@react-spring/web";
import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { Textarea } from "components/Textarea";
import { useStudioData } from "hooks/useStudioData";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Router from "next/router";
import { Fragment, useEffect, useState } from "react";
import { base62ToUuid, uuidToBase62 } from "src/uuidHelpers";

import { Tab } from "@headlessui/react";
import { useSearchParams } from "next/navigation";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  let id = props.id;
  let { data } = useStudioData(id, props.data);
  useEffect(() => {
    if (id) Router.replace(`/studio/${uuidToBase62(id)}`);
  }, [id]);
  if (!data || !id) return null;
  return (
    <>
      <Head>
        <title key="title">{data?.name}</title>
      </Head>
      <SpaceProvider id={data?.do_id}>
        <StudioPageContent data={data} />
      </SpaceProvider>
    </>
  );
}
const Tabs = { About: About, Spaces: SpaceList, Members: Members };

function StudioPageContent({
  data,
}: {
  data: ReturnType<typeof useStudioData>["data"];
}) {
  let tab = "About";
  let [selectedIndex, setSelectedIndex] = useState(0);

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
        <Tab.List className="flex w-full flex-row justify-center gap-2">
          {Object.keys(Tabs).map((tab) => (
            <TabItem name={tab} key={tab} />
          ))}
        </Tab.List>
        <Tab.Panels>
          {Object.values(Tabs).map((T, index) => (
            <Tab.Panel key={index}>
              <T data={data} />
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

function SpaceList({ data }: Pick<Props, "data">) {
  let [search, setSearch] = useState("");

  let spaces = data?.spaces_in_studios.filter(
    ({ space_data: s }) =>
      s && !s.archived && s.display_name?.toLocaleLowerCase().includes(search)
  );

  if (!data) return;
  return (
    <div className="m-auto flex h-full w-full max-w-6xl flex-col items-stretch gap-2">
      <div className="flex w-full flex-row justify-between ">
        <h1>{data.name}</h1>

        <div className="flex flex-row ">
          <input
            className="w-64"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
      </div>
      <div className="no-scrollbar relative flex h-full w-full flex-row gap-2 overflow-y-scroll ">
        <List
          id={data.id}
          spaces={spaces?.map((s) => s.space_data as SpaceData) || []}
        />
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="h-full rounded-lg border border-grey-80 bg-white p-4">
      {<Textarea className="h-full" placeholder="write a readme..." />}
    </div>
  );
}

const List = (props: { spaces: Array<SpaceData>; id: string }) => {
  let { query } = useRouter();

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <AddSpace id={props.id} />
        {props.spaces.map((space) => {
          return (
            <div className="" key={space.id}>
              <Link
                href={`/studio/${query.studio_id}/space/${space.id}`}
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

function Members({ data }: Pick<Props, "data">) {
  return (
    <>
      <div>members</div>

      {data?.members_in_studios.map((m) => (
        <div key={m.member}>{m.identity_data?.username}</div>
      ))}
    </>
  );
}

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.studio_id)
    return { props: { notFound: true }, revalidate: 10 } as const;

  let id = ctx.params.studio_id as string;
  if (id.length !== 36) id = base62ToUuid(id);
  let data = await workerAPI(WORKER_URL, "get_studio_data", {
    id,
  });

  if (!data.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, data: data.data, id } };
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}
