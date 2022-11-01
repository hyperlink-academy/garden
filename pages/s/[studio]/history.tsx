import { workerAPI } from "backend/lib/api";
import { ButtonLink } from "components/Buttons";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceList } from "components/SpacesList";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, scanIndex, useIndex } from "hooks/useReplicache";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext } from "react";
import { useSubscribe } from "replicache-react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!props.id) return <div>loading </div>;

  return (
    <SpaceProvider id={props.id}>
      <div className="grid grid-flow-row gap-8 my-6">
        <div className="flex justify-between">
          <StudioName />
          <Logout />
        </div>
      </div>
      <List />
    </SpaceProvider>
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
const StudioName = () => {
  let name = useIndex.aev("this/name", "")[0];
  if (!name) return null;
  return (
    <>
      <Head>
        <title key="title">{name?.value}'s studio</title>
      </Head>
      <div>
        <h1>{name?.value}'s studio</h1>
      </div>
    </>
  );
};

const Logout = () => {
  let { session, logout } = useAuth();
  let router = useRouter();
  return session.session?.username === router.query.studio ? (
    <div className="self-center">
      <ButtonLink content="logout" onClick={() => logout()} />
    </div>
  ) : null;
};

export async function getStaticPaths() {
  return { paths: [], fallback: true };
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
