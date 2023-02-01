import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceList } from "components/SpacesList";
import { StudioName } from "components/StudioLayout";
import { useIndex } from "hooks/useReplicache";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!props.id) return <div>loading </div>;

  return (
    <SpaceProvider id={props.id}>
      <StudioName />
      <List />
    </SpaceProvider>
  );
}

const List = () => {
  let now = new Date().toLocaleDateString("en-CA");
  const spaces = useIndex
    .aev("space/end-date")
    .filter((s) => s.value.value && s.value.value < now);

  return <SpaceList spaces={spaces} />;
};

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.studio)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let id = await workerAPI(WORKER_URL, "get_studio", {
    name: ctx.params?.studio as string,
  });
  if (!id.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, id: id.id } };
}
