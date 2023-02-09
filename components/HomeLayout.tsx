import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { LoginForm } from "pages/login";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import { Modal } from "./Layout";
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
  let myStudioName = session.session?.username;
  let currentStudioName = query.studio;
  let decorationClasses =
    "underline decoration-2 decoration-accent-blue underline-offset-4";

  return (
    <div className="HomeHeader pwa-padding sticky top-0 z-10 mb-4 flex justify-between border-b border-grey-55 bg-background py-4">
      {!myStudioName ? (
        <Login />
      ) : (
        <Link
          href={`/s/${myStudioName}`}
          className={
            currentStudioName == myStudioName &&
            (pathname?.endsWith("/s/[studio]") ||
              pathname?.endsWith("/s/[studio]/history"))
              ? decorationClasses
              : ``
          }
        >
          <ButtonLink content="my studio" />
        </Link>
      )}

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

const Login = () => {
  let [isOpen, setIsOpen] = useState(false);
  let router = useRouter();

  return (
    <>
      <ButtonLink content="log in" onClick={() => setIsOpen(true)} />
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <LoginForm onLogin={(s) => router.push(`/s/${s.username}`)} />
      </Modal>
    </>
  );
};

// NB: currently unused!
const Logout = () => {
  let { session, logout } = useAuth();
  let router = useRouter();
  return session.session?.username === router.query.studio ? (
    <div className="self-center">
      <ButtonLink content="logout" onClick={() => logout()} />
    </div>
  ) : null;
};
