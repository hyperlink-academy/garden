import { useAuth } from "hooks/useAuth";
import { useIndex } from "hooks/useReplicache";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ButtonLink } from "./Buttons";

export const StudioName = () => {
  let name = useIndex.aev("this/name", "")[0];
  if (!name) return null;

  let { query, pathname } = useRouter();
  let { session } = useAuth();
  let myStudioName = session.session?.username;
  let currentStudioName = query.studio;
  let decorationClasses =
    "underline decoration-2 decoration-accent-blue underline-offset-4";

  return (
    <>
      <Head>
        <title key="title">{name?.value}'s studio</title>
        <meta name="theme-color" content="#fffaf0" />
      </Head>
      <div>
        <h1>{name?.value}'s studio</h1>
      </div>
      {currentStudioName == myStudioName ? (
        <div className="flex flex-row gap-4">
          {/* MY studio: active + history */}
          <Link
            href={`/s/${myStudioName}`}
            className={
              pathname?.endsWith("/s/[studio]") ? decorationClasses : ``
            }
          >
            <ButtonLink content="active" />
          </Link>
          <Link
            href={`/s/${myStudioName}/history`}
            className={
              pathname?.endsWith("/s/[studio]/history") ? decorationClasses : ``
            }
          >
            <ButtonLink content="history" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-row gap-4">
          {/* someone ELSE'S studio: active + history */}
          <Link
            href={`/s/${currentStudioName}`}
            className={
              pathname?.endsWith("/s/[studio]") ? decorationClasses : ``
            }
          >
            <ButtonLink content="active" />
          </Link>
          <Link
            href={`/s/${currentStudioName}/history`}
            className={
              pathname?.endsWith("/s/[studio]/history") ? decorationClasses : ``
            }
          >
            <ButtonLink content="history" />
          </Link>
        </div>
      )}
    </>
  );
};
