import { SpaceProvider } from "components/ReplicacheProvider";
import { useAuth } from "hooks/useAuth";
import { useIndex } from "hooks/useReplicache";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ButtonLink } from "./Buttons";

export const StudioLayout = (props: {
  id: string;
  children: React.ReactNode;
}) => {
  let { query, pathname } = useRouter();
  return (
    <SpaceProvider id={props.id}>
      <div className="flex flex-col gap-2 p-4 m-auto max-w-3xl">
        <StudioHeader />
        {props.children}
      </div>
    </SpaceProvider>
  );
};

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

const StudioHeader = () => {
  let { query, pathname } = useRouter();
  return (
    <div className="flex justify-between py-4">
      {/* <div className="flex justify-between">
        <StudioName />
        <Logout />
      </div> */}
      <div className="flex flex-row gap-4">
        <Link href={`/s/${query.studio}`}>
          <ButtonLink content="now" />
        </Link>
        <Link href={`/s/${query.studio}/future`}>
          <ButtonLink content="future" />
        </Link>
        <Link href={`/s/${query.studio}/history`}>
          <ButtonLink content="history" />
        </Link>
      </div>
      <div>
        <Link href={`/s/${query.studio}/calendar`}>
          <ButtonLink content="calendar" />
        </Link>
      </div>

      {/* {pathname.endsWith("history") ? (
        <Link href={`/s/${query.studio}`}>
          <ButtonLink content="active" />
        </Link>
      ) : (
        <Link href={`/s/${query.studio}/history`}>
          <ButtonLink content="history" />
        </Link>
      )} */}
    </div>
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
