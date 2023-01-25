import { workerAPI } from "backend/lib/api";
import { SpaceList } from "components/SpacesList";
import { CreateSpace, StudioName } from "components/StudioLayout";
import { useIndex } from "hooks/useReplicache";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { sortByPosition } from "src/position_helpers";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!props.id) return <div>loading </div>;

  return (
    <>
      <StudioName />
      <List />
      <CreateSpace studioSpaceID={props.id} />
    </>
  );
}
const List = () => {
  let spaces = useIndex.aev("space/name").sort(sortByPosition("aev"));
  let completedSpaces = useIndex
    .aev("space/completed")
    .sort(sortByPosition("aev"));
  return (
    <SpaceList
      spaces={spaces.filter(
        (f) => !completedSpaces.find((c) => c.entity === f.entity && c.value)
      )}
    />
  );
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
