import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { ButtonLink } from "./Buttons";
import { SpaceProvider } from "./ReplicacheProvider";

export const HomeLayout = (props: {
  id: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="m-auto flex max-w-3xl flex-col gap-2 px-4 pb-8">
      <HomeHeader />
      {props.children}
    </div>
  );
};

export const HomeHeader = () => {
  let { query, pathname } = useRouter();
  let { session } = useAuth();
  let studioName = session.session?.username;
  let decorationClasses =
    "underline decoration-2 decoration-accent-blue underline-offset-4";

  if (!studioName) return null;

  return (
    <div className="HomeHeader sticky top-0 z-10 mx-[-1000px] mb-4 flex justify-between bg-background py-4 px-[1000px] shadow-md">
      <div className="flex flex-row gap-4">
        <Link
          href={`/s/${studioName}`}
          className={pathname?.endsWith("/s/[studio]") ? decorationClasses : ``}
        >
          <ButtonLink content="now" />
        </Link>
        <Link
          href={`/s/${studioName}/future`}
          className={
            pathname?.endsWith("/s/[studio]/future") ? decorationClasses : ``
          }
        >
          <ButtonLink content="future" />
        </Link>
        <Link
          href={`/s/${studioName}/history`}
          className={
            pathname?.endsWith("/s/[studio]/history") ? decorationClasses : ``
          }
        >
          <ButtonLink content="history" />
        </Link>
      </div>
      <div>
        <Link
          href={`/calendar`}
          className={pathname?.endsWith("calendar") ? decorationClasses : ``}
        >
          <ButtonLink content="calendar" />
        </Link>
      </div>
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
