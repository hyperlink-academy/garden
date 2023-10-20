import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import Link from "next/link";
import { ModalSubmitButton } from "components/Modal";

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
      <div className=" h-[140px] w-[164px] bg-test-pink" />
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
            className="w-full"
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
      <div className="LogInSSO flex flex-col gap-2 font-bold text-grey-35">
        <button className="lightBorder flex w-full items-center  justify-center gap-4 py-2 hover:border-accent-blue hover:bg-bg-blue">
          <img src="/sso/google.svg" width={24} alt="google" />
          <p>Log In with Google</p>
        </button>
        <button className="lightBorder flex w-full items-center justify-center gap-4 py-2 hover:border-accent-blue hover:bg-bg-blue">
          <img src="/sso/apple.svg" width={24} alt="apple" />

          <p>Log In with Apple</p>
        </button>
      </div>
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
