import { workerAPI } from "backend/lib/api";
import { ButtonTertiary } from "components/Buttons";
import { MoreOptionsSmall } from "components/Icons";
import { StudioOptionsMenu } from "components/StudioPage/StudioOptionsMenu";
import { useStudioData } from "hooks/useStudioData";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useRouter } from "next/router";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  let { query } = useRouter();
  let { data } = useStudioData(query.studio_id as string, props.data);
  return (
    <div>
      <div className="flex flex-row justify-between">
        <h1>{data?.name}</h1>
        <div className="flex flex-row items-center gap-2">
          <ButtonTertiary content={"Add a space"} />
          <StudioOptionsMenu id={query.studio_id as string} />
        </div>
      </div>
      {data?.description}
      <pre>{JSON.stringify(data, undefined, 2)}</pre>
    </div>
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
