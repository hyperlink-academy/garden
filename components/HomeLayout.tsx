import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { LoginForm } from "pages/login";
import { useState } from "react";
import { ButtonLink, ButtonSecondary, ButtonTertiary } from "./Buttons";
import { Modal } from "./Layout";
import * as Popover from "@radix-ui/react-popover";
import { CreateStudio } from "./CreateStudio";
import { useIdentityData } from "hooks/useIdentityData";

export const HomeLayout = (props: {
  id: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="m-auto flex flex-col overflow-x-hidden bg-white">
      <div className="sticky top-0">
        <HomeHeader />
        <div className="outline-b-0  -mx-0.5 h-3 rounded-t-[8px] border-2 border-b-0 border-grey-80 bg-background" />
      </div>
      <div className="bg-background px-2 pt-2 ">
        <div className="m-auto max-w-3xl">{props.children}</div>
      </div>
    </div>
  );
};

export const HomeHeader = () => {
  let { session } = useAuth();
  let myStudioName = session.session?.username;

  return (
    <div className="HomeHeader pwa-padding sticky top-0 z-10 m-auto  flex w-full max-w-4xl flex-row justify-between bg-white py-2 px-2">
      <Link href={myStudioName ? `/s/${myStudioName}` : "/"}>
        <span className="flex flex-row items-center font-bold text-grey-35">
          <img src="/android-chrome-192x192.png" width={32} className="-mr-1" />
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
          <button className="font-bold text-grey-35">Studios</button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="flex max-w-md flex-col gap-2 rounded-md border-2 border-grey-80 bg-white p-2 drop-shadow-md"
            sideOffset={-4}
          >
            <Popover.Arrow className="fill-grey-80 stroke-grey-80" />

            {studios?.map((s) => (
              <Link href={`/studio/${s.id}`} key={s.id}>
                <Popover.Close>{s.name}</Popover.Close>
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
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <LoginForm
          onLogin={(s) =>
            s.username ? router.push(`/s/${s.username}`) : router.push("/setup")
          }
        />
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
