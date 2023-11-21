import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import Link from "next/link";
import { ModalSubmitButton } from "components/Modal";
import { OAuth } from "components/LoginModal";

export default function LoginPage() {
  let router = useRouter();
  return (
    <div className=" -my-4 mx-auto flex h-screen  max-w-md flex-col items-center justify-center gap-4">
      <h1 className="w-full">
        Welcome Back to{" "}
        <Link className="text-accent-blue hover:underline" href="/">
          Hyperlink
        </Link>
        !
      </h1>
      <div className="lightBorder w-full bg-white p-4">
        <LoginForm
          onLogin={(s) => {
            s.username
              ? router.push(`/s/${s.username}`)
              : router.push("/setup");
          }}
        />{" "}
      </div>
    </div>
  );
}

export function LoginForm(props: {
  onLogin: (s: { username?: string }) => void;
  onClose?: () => void;
  onSwitchToSignUp?: () => void;
}) {
  let [data, setData] = useState({
    email: "",
    password: "",
  });

  let { login, signup } = useAuth();
  let [status, setStatus] = useState<
    "normal" | "incorrect" | "loading" | "confirmEmail"
  >("normal");
  useEffect(() => {
    setStatus("normal");
  }, [data.email, data.password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    let result = await login(data);
    if (result?.error === "confirmEmail") {
      setStatus("confirmEmail");
      return;
    }
    if (!result?.data?.user) setStatus("incorrect");
    else {
      setStatus("normal");
      props.onLogin(result.data.user.user_metadata as { username?: string });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <img
        className="w-full rounded-md"
        width={"216px"}
        alt="an overgrown porch at night, with a light on in the window/"
        src="/img/spotIllustration/login.png"
      />
      <div className="mt-4 flex items-baseline justify-between">
        <h2 className="text-grey-15">Log in</h2>{" "}
        <p>
          or{" "}
          <button
            className="font-bold text-accent-blue hover:underline"
            onClick={() => {
              if (props.onSwitchToSignUp) {
                props.onSwitchToSignUp();
              } else router.push("/signup");
            }}
          >
            sign up
          </button>
        </p>
      </div>
      <form className="grid w-full gap-2" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 font-bold">
          Email
          <input
            className="w-full font-normal"
            type="email"
            required
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
          />
        </label>
        <label className="flex flex-col gap-1 font-bold">
          <div className="flex items-baseline justify-between">
            Password{" "}
            <Link
              className="font-normal text-accent-blue
            "
              href={`/reset-password`}
            >
              <p className="">reset</p>
            </Link>
          </div>
          <input
            className="font-normal"
            type="password"
            value={data.password}
            required
            onChange={(e) =>
              setData({ ...data, password: e.currentTarget.value })
            }
          />
        </label>
        {status === "normal" || status === "loading" ? null : status ===
          "incorrect" ? (
          <div className="text-sm text-accent-red">
            Your email or password is incorrect.
          </div>
        ) : (
          <ResendEmail {...data} />
        )}

        {props.onClose ? (
          <ModalSubmitButton
            content={status === "loading" ? "" : "Log In!"}
            icon={status === "loading" ? <DotLoader /> : undefined}
            onClose={() => {
              if (props.onClose) {
                props.onClose();
              }
              return;
            }}
          />
        ) : (
          <ButtonPrimary
            className="place-self-end"
            content={status === "loading" ? "" : "Log In!"}
            icon={status === "loading" ? <DotLoader /> : undefined}
            type="submit"
          />
        )}
      </form>
      <div className="LogInDivider flex items-center gap-2 py-2 text-grey-80">
        <hr className="grow" />{" "}
        <p className="shrink-0 italic text-grey-55">or</p>
        <hr className="grow" />
      </div>
      <OAuth actionLabel="Log In" />
    </div>
  );
}

const ResendEmail = (props: { email: string; password: string }) => {
  let { login, signup } = useAuth();
  let [status, setStatus] = useState<"normal" | "loading" | "sent">("normal");
  return (
    <div>
      You need to confirm your email.{" "}
      {status === "loading" ? (
        <DotLoader />
      ) : status === "sent" ? (
        <div>sent</div>
      ) : (
        <ButtonLink
          content="Resend confirmation email?"
          onClick={async () => {
            setStatus("loading");
            let result = await signup({
              email: props.email,
              password: props.password,
            });
            console.log(result);
            setStatus("sent");
          }}
        />
      )}
    </div>
  );
};
