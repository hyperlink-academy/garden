import { workerAPI } from "backend/lib/api";
import { SpaceList } from "components/SpacesList";
import { CreateSpace, StudioName } from "components/StudioLayout";
import { ReplicacheContext, scanIndex } from "hooks/useReplicache";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useContext } from "react";
import { useSubscribe } from "replicache-react";

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
  let rep = useContext(ReplicacheContext);
  let spaces = useSubscribe(
    rep?.rep,
    async (tx) => {
      let completedSpaces = await scanIndex(tx).aev("space/completed");
      let results = [];
      for (let space of completedSpaces) {
        if (space.value) {
          let name = await scanIndex(tx).eav(space.entity, "space/name");
          if (name !== null) results.push(name);
        }
      }
      return results;
    },
    [],
    []
  );

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
