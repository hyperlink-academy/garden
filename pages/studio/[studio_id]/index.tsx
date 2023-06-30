import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData, SpaceList } from "components/SpacesList";
import { AddSpace } from "components/StudioPage/AddSpace";
import { StudioOptionsMenu } from "components/StudioPage/StudioOptionsMenu";
import { StudioPosts } from "components/StudioPosts";
import { useAuth } from "hooks/useAuth";
import { useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  let { query } = useRouter();
  let { authorized } = useMutations();
  let { session } = useAuth();

  let id = query.studio_id as string;
  let { data } = useStudioData(id, props.data);
  let [view, setView] = useState<"posts" | "spaces">("posts");
  if (!data) return null;
  return (
    <>
      <Head>
        <title key="title">{data?.name}</title>
      </Head>
      <SpaceProvider id={data?.do_id}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-start justify-between gap-4">
            <h1>{data?.name}</h1>
            {/* TODO - replace this with updated 'authorized' in useMutations() */}
            {data?.members_in_studios.find(
              (m) => m.member === session?.user?.id
            ) && (
              <div className="flex flex-row items-center gap-2">
                <AddSpace id={id} />
                <StudioOptionsMenu id={id} />
              </div>
            )}
          </div>
          <p>{data?.description}</p>
          <div className="flex flex-col">
            <div className="flex self-end">
              <button
                onClick={() => setView(view === "spaces" ? "posts" : "spaces")}
                className={`-mr-[2px] rounded-t-md border-2 border-b-0  py-1 px-2  ${
                  view === "posts"
                    ? "border-accent-blue bg-bg-blue font-bold text-accent-blue"
                    : "bg-white text-grey-35"
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setView(view === "spaces" ? "posts" : "spaces")}
                className={`rounded-t-md border-2 border-b-0  py-1 px-2 ${
                  view === "spaces"
                    ? "border-accent-blue bg-bg-blue font-bold text-accent-blue"
                    : "bg-white text-grey-35"
                }`}
              >
                Spaces
              </button>
            </div>
            <hr className="border border-accent-blue" />
          </div>
          {view === "posts" ? (
            <StudioPosts id={query.studio_id as string} />
          ) : (
            <SpaceList
              spaces={
                data?.spaces_in_studios.map((s) => s.space_data as SpaceData) ||
                []
              }
            />
          )}
        </div>
      </SpaceProvider>
    </>
  );
}

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.studio_id)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let data = await workerAPI(WORKER_URL, "get_studio_data", {
    id: ctx.params?.studio_id as string,
  });

  if (!data.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, data: data.data } };
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}
