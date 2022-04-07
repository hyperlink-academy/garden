import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChatBubble, House, Information, SpreadDeck } from "./Icons";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "./Buttons";
import { useState } from "react";
import { Dialog } from "@headlessui/react";

export function SpaceNavFooter(props: { currentPage: string }) {
  let router = useRouter();
  let { session } = useAuth();

  let [data, setData] = useState({
    username: "",
    password: "",
  });

  let { login, logout } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let session = await login(data);
  };

  function LogInModal() {
    let [isOpen, setLogInModal] = useState(true);

    return (
      <div>
        <ButtonLink
          className="justify-self-start"
          content="Log In"
          onClick={() => setLogInModal(true)}
        />

        <Dialog
          open={isOpen}
          onClose={() => setLogInModal(false)}
          className="fixed z-10 inset-0 overflow-y-hidden"
        >
          <Dialog.Overlay className="overlay" />

          <div
            className={`
                logInModal
                px-3 py-4
                border border-grey-80 rounded-md 
                shadow-drop
                bg-white
                w-[calc(100%-40px)]
                fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                grid grid-flow-row gap-4
                ${!isOpen ? "hidden" : ""}
                `}
          >
            <form className="grid gap-4 w-full" onSubmit={onSubmit}>
              <label className="grid grid-flow-rows gap-2 font-bold">
                Username
                <input
                  className="w-[100%]]"
                  type="text"
                  value={data.username}
                  onChange={(e) =>
                    setData({ ...data, username: e.currentTarget.value })
                  }
                />
              </label>
              <label className="grid grid-flow-rows gap-2 font-bold">
                Password
                <input
                  type="password"
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.currentTarget.value })
                  }
                />
              </label>

              <div
                className={`grid grid-cols-[max-content_auto_max-content] gap-4`}
              >
                <ButtonTertiary
                  content="Nevermind"
                  onClick={() => setLogInModal(false)}
                />
                <Link href="/signup">
                  <a className="justify-self-end self-center">
                    <ButtonLink
                      content="Sign Up"
                      onClick={() => setLogInModal(false)}
                    />
                  </a>
                </Link>
                <ButtonPrimary
                  type="submit"
                  content="Log In!"
                  onClick={() => setLogInModal(false)}
                />
              </div>
            </form>
          </div>
        </Dialog>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100vw",
      }}
      className={`
        grid grid-cols-[1fr,1fr,1fr] gap-1 items-center
        bg-background border-t-2 border-grey-15 
        px-4 pb-5
        fixed
        bottom-0
        left-0
        `}
    >
      {/* BACK TO STUDIO */}

      {!session?.loggedIn ? (
        <LogInModal />
      ) : (
        // <Link href="/login">
        //   <ButtonLink className="justify-self-start" content="Log In">
        //     Log In!
        //   </ButtonLink>
        // </Link>
        <Link href={`/s/${session.session.username}`}>
          <a className="justify-self-start">
            <House className="text-grey-55" />
          </a>
        </Link>
      )}

      <div className="justify-self-center flex flex-row">
        {/* DECKS */}
        <Link href={`/s/${router.query.studio}/a/${router.query.activity}`}>
          <a className="border-2 border-t-0 rounded-b-lg px-2 relative -top-0.5 bg-background border-grey-15">
            <SpreadDeck />
          </a>
        </Link>

        {/* CHAT */}
        <Link href="/chat">
          <a>
            <ChatBubble />
          </a>
        </Link>
      </div>

      {/* INFO */}
      <Link href="/">
        <a className="justify-self-end">
          <Information className="text-grey-55" />
        </a>
      </Link>
    </div>
  );
}
