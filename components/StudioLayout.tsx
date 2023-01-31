import { useIndex } from "hooks/useReplicache";
import Head from "next/head";

export const StudioName = () => {
  let name = useIndex.aev("this/name", "")[0];
  if (!name) return null;
  return (
    <>
      <Head>
        <title key="title">{name?.value}'s studio</title>
        <meta name="theme-color" content="#fffaf0" />
      </Head>
      <div>
        <h1>{name?.value}'s studio</h1>
      </div>
    </>
  );
};
