import { animated, useSpring } from "@react-spring/web";
import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { StudioMembers } from "components/StudioPage/Members";
import { StudioSpaces } from "components/StudioPage/Spaces";
import { StudioPosts } from "components/StudioPosts";
import { Textarea } from "components/Textarea";
import { RenderedText } from "components/Textarea/RenderedText";
import { useStudioData } from "hooks/useStudioData";
import { useViewportDifference, useViewportSize } from "hooks/useViewportSize";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Router from "next/router";
import { useEffect, useState } from "react";
import { base62ToUuid, uuidToBase62 } from "src/uuidHelpers";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export type View = "posts" | "spaces" | "members";
export default function StudioPage(props: Props) {
  let id = props.id;
  let { data } = useStudioData(id, props.data);
  useEffect(() => {
    if (id) Router.replace(`/studio/${uuidToBase62(id)}`);
  }, [id]);
  if (!data || !id) return null;
  console.log(data);
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

const StudioPageContent = ({
  data,
}: {
  data: ReturnType<typeof useStudioData>["data"];
}) => {
  let viewheight = useViewportSize().height;
  let difference = useViewportDifference();
  let heightSpring = useSpring({
    height: viewheight,
  });
  let [search, setSearch] = useState("");

  let spaces = data?.spaces_in_studios.filter(
    ({ space_data: s }) =>
      s && !s.archived && s.display_name?.toLocaleLowerCase().includes(search)
  );

  if (!data) return;
  return (
    <animated.div
      style={difference > 100 ? heightSpring : undefined}
      className="spacecontent max-w-screen-xl relative mx-auto flex h-screen w-full grow pb-2 sm:px-4 sm:py-4"
    >
      <div className="flex h-full w-full flex-col items-stretch gap-2">
        <div className="flex w-full flex-row justify-between ">
          <h2>{data.name}</h2>

          <div className="flex flex-row ">
            <input
              className="w-64"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
        </div>
        <div className="no-scrollbar relative flex h-full w-full flex-row gap-2 overflow-y-scroll ">
          <Sidebar data={data} />
          <List
            id={data.id}
            spaces={spaces?.map((s) => s.space_data as SpaceData) || []}
          />
        </div>
      </div>
    </animated.div>
  );
};

const Sidebar = ({
  data,
}: {
  data: ReturnType<typeof useStudioData>["data"];
}) => {
  let [state, setState] = useState<"readme" | "members">("readme");

  return (
    <div className="flex h-full min-w-[302px] flex-col justify-between rounded-lg border border-grey-80 bg-white p-3">
      <div className="h-full">
        {state === "readme" ? (
          <Textarea className="h-full" placeholder="write a readme..." />
        ) : (
          <>
            <div>members</div>

            {data?.members_in_studios.map((m) => (
              <div key={m.member}>{m.identity_data?.username}</div>
            ))}
          </>
        )}
      </div>
      <button
        className="w-full border"
        onClick={() => setState(state === "readme" ? "members" : "readme")}
      >
        {state === "readme" ? "members" : "readme"}
      </button>
    </div>
  );
};

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

function View(props: { view: View; id: string }) {
  switch (props.view) {
    case "posts":
      return <StudioPosts id={props.id} />;
    case "members":
      return <StudioMembers id={props.id} />;
    case "spaces":
      return <StudioSpaces id={props.id} />;
  }
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
