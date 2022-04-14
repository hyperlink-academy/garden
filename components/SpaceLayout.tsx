import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChatBubble, Studio, Information, DeckLarge } from "./Icons";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "./Buttons";
import { useEffect, useState } from "react";
import { Modal } from "components/Layout";

export const SpaceLayout: React.FC = (props) => {
  return (
    <div
      style={{
        maxWidth: "48rem",
        margin: "auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        paddingTop: "8px",
        alignItems: "stretch",
        position: "relative",
      }}
    >
      <div className="h-full border-grey-15 pt-4 overflow-auto">
        {props.children}
      </div>
      <Footer />
    </div>
  );
};

const selectedClassname =
  "border-2 border-t-0 rounded-b-lg px-2 relative -top-0.5 bg-background border-grey-15";
export function Footer() {
  let router = useRouter();
  let { session } = useAuth();

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
        `}
    >
      {/* BACK TO STUDIO */}

      {!session?.loggedIn ? (
        <LogInModal />
      ) : (
        <Link href={`/s/${session.session.username}`}>
          <a className="justify-self-start">
            <Studio className="text-grey-55" />
          </a>
        </Link>
      )}

      <div className="justify-self-center flex flex-row">
        {/* DECKS */}
        <Link href={`/s/${router.query.studio}/s/${router.query.space}`}>
          <a
            className={
              router.pathname === "/s/[studio]/s/[space]/chat"
                ? "w-16"
                : selectedClassname
            }
          >
            <DeckLarge className="mx-auto" />
          </a>
        </Link>

        {/* CHAT */}
        <Link href={`/s/${router.query.studio}/s/${router.query.space}/chat`}>
          <a
            className={
              router.pathname === "/s/[studio]/s/[space]/chat"
                ? selectedClassname
                : "w-16"
            }
          >
            <ChatBubble className="mx-auto" />
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

function LogInModal() {
  let [isOpen, setLogInModal] = useState(false);
  let [data, setData] = useState({
    username: "",
    password: "",
  });
  let [status, setStatus] = useState<"normal" | "incorrect">("normal");
  useEffect(() => {
    setStatus("normal");
  }, [data.username, data.password]);

  let { login } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result = await login(data);
    if (!result.success) setStatus("incorrect");
  };

  return (
    <div>
      <ButtonLink
        className="justify-self-start"
        content="Log In"
        onClick={() => setLogInModal(true)}
      />

      <Modal open={isOpen} onClose={() => setLogInModal(false)}>
        <form className="grid gap-4 w-full" onSubmit={onSubmit}>
          {status === "normal" ? null : (
            <div className="text-accent-red">
              Your username or password is incorrect
            </div>
          )}
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
            <ButtonPrimary type="submit" content="Log In!" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
