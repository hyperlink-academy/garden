import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { StudioHeader } from "components/StudioPage/Header";
import { StudioMembers } from "components/StudioPage/Members";
import { StudioSpaces } from "components/StudioPage/Spaces";
import { StudioPosts } from "components/StudioPosts";
import { useStudioData } from "hooks/useStudioData";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export type View = "posts" | "spaces" | "members";
export default function StudioPage(props: Props) {
  let { query } = useRouter();

  let id = query.studio_id as string;
  let { data } = useStudioData(id, props.data);
  let [view, setView] = useState<View>("posts");
  if (!data) return null;
  return (
    <>
      <Head>
        <title key="title">{data?.name}</title>
      </Head>
      <SpaceProvider id={data?.do_id}>
        <div className="flex flex-col gap-4">
          <StudioHeader id={id} view={view} setView={setView} />
          <View view={view} id={id} />
        </div>
      </SpaceProvider>
    </>
  );
}

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
