import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ButtonLink } from "./Buttons";

export const StudioName = () => {
  let { query } = useRouter();
  let currentStudioName = query.studio;
  let decorationClasses =
    "underline decoration-2 decoration-accent-blue underline-offset-4";

  return (
    <>
      <Head>
        <title key="title">{currentStudioName + "'s studio"}</title>
      </Head>
      <div>
        <h1>{currentStudioName + "'s studio"}</h1>
      </div>
      <div className="flex flex-row gap-4">
        {/* someone ELSE'S studio: active + history */}
        <Link
          replace
          href={`/s/${currentStudioName}`}
          className={query.history === undefined ? decorationClasses : ``}
        >
          <ButtonLink content="active" />
        </Link>
        <Link
          replace
          href={`/s/${currentStudioName}?history`}
          className={query.history !== undefined ? decorationClasses : ``}
        >
          <ButtonLink content="history" />
        </Link>
      </div>
    </>
  );
};
