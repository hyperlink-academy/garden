import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import * as Popover from "@radix-ui/react-popover";
import { CreateStudio } from "./CreateStudio";
import { useIdentityData } from "hooks/useIdentityData";
import { uuidToBase62 } from "src/uuidHelpers";
import Head from "next/head";
import { LogInModal } from "./LoginModal";

export const HomeLayout = (props: {
  id: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <Head>
        <meta name="theme-color" content="#FFFFFF" />
      </Head>
      <div className="m-auto flex flex-col overflow-x-hidden bg-white">
        <div className="sticky top-0">
          <HomeHeader />
          <div className="outline-b-0  -mx-0.5 h-3 rounded-t-[8px] border-2 border-b-0 border-grey-80 bg-background" />
        </div>
        <div className="bg-background p-4">
          <div className="m-auto max-w-4xl">{props.children}</div>
        </div>
      </div>
    </>
  );
};

export const HomeHeader = () => {
  let { session } = useAuth();
  let myStudioName = session.session?.username;

  return (
    <div className="HomeHeader pwa-padding sticky top-0 z-10 m-auto flex w-full max-w-4xl flex-row justify-between bg-white px-2 py-2">
      <Link href={myStudioName ? `/s/${myStudioName}` : "/"}>
        <span className="flex flex-row items-center font-bold text-grey-35 hover:text-accent-blue">
          <img
            src="/android-chrome-192x192.png"
            width={32}
            className="-mr-1"
            alt="home icon"
          />
          ome
        </span>
      </Link>
      {!myStudioName ? <Login /> : <StudiosList username={myStudioName} />}
    </div>
  );
};

const StudiosList = (props: { username: string }) => {
  let { data } = useIdentityData(props.username);
  let studios = data?.members_in_studios.map(
    (s) => s.studios as Exclude<typeof s.studios, null>
  );
  return (
    <>
      <Popover.Root>
        <Popover.Trigger>
          <button className="font-bold text-grey-35 hover:text-accent-blue">
            Studios
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-20 flex max-w-xs flex-col gap-2 rounded-md border-2 border-grey-80 bg-white p-2 drop-shadow-md"
            sideOffset={-4}
          >
            <Popover.Arrow className="fill-grey-80 stroke-grey-80" />

            {studios?.map((s) => (
              <Link href={`/studio/${uuidToBase62(s.id)}`} key={s.id}>
                <Popover.Close className="w-full px-2 py-1 text-left text-grey-35 hover:bg-bg-blue">
                  {s.name}
                </Popover.Close>
              </Link>
            ))}
            <CreateStudio username={props.username} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
};

const Login = () => {
  let [isOpen, setIsOpen] = useState(false);
  let router = useRouter();

  return (
    <>
      <ButtonLink content="log in" onClick={() => setIsOpen(true)} />

      <LogInModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
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
