"use client";
import { SignupForm } from "pages/signup";
import { Modal } from "./Modal";
import { useEffect, useState } from "react";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { ModalSubmitButton } from "components/Modal";
import { DotLoader } from "components/DotLoader";
import { supabaseBrowserClient } from "supabase/clients";

export const LoginOrSignupModal = (props: {
  state: "login" | "signup" | "closed";
  setState: (s: "login" | "signup" | "closed") => void;
  redirectOnLogin?: (s: { username?: string }) => void;
  redirectTo?: string;
}) => {
  return (
    <Modal
      open={props.state !== "closed"}
      onClose={() => props.setState("closed")}
      noCloseButton
    >
      {props.state === "login" ? (
        <LoginForm
          onLogin={(s) => {
            if (props.redirectOnLogin) {
              props.redirectOnLogin(s);
            }
          }}
          onClose={() => props.setState("closed")}
          onSwitchToSignUp={() => props.setState("signup")}
        />
      ) : (
        <SignupForm
          redirectTo={props.redirectTo}
          onClose={() => props.setState("closed")}
          onSwitchToLogIn={() => props.setState("login")}
        />
      )}
    </Modal>
  );
};

LoginOrSignupModal.useState = (initialState: "login" | "signup" | "closed") => {
  return useState(initialState);
};

const buttonClass =
  "lightBorder flex w-full items-center  justify-center gap-4 py-2 hover:border-accent-blue hover:bg-bg-blue";
export const OAuth = (props: { actionLabel: string }) => {
  let supabase = supabaseBrowserClient();
  return (
    <div className="LogInSSO flex flex-col gap-2 font-bold text-grey-35">
      <button
        className={buttonClass}
        onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
      >
        <img src="/sso/google.svg" width={24} alt="google" />
        <p>{props.actionLabel} with Google</p>
      </button>
      {/* <button
        className={buttonClass}
        onClick={() => supabase.auth.signInWithOAuth({ provider: "apple" })}
      >
        <img src="/sso/apple.svg" width={24} alt="apple" />
        <p>{props.actionLabel} with Apple</p>
      </button> */}
    </div>
  );
};

export function LoginForm(props: {
  onLogin?: (s: { username?: string }) => void;
  onClose?: () => void;
  onSwitchToSignUp?: () => void;
}) {
  let [data, setData] = useState({
    email: "",
    password: "",
  });

  let { login } = useAuth();
  let [status, setStatus] = useState<
    "normal" | "incorrect" | "loading" | "confirmEmail"
  >("normal");
  useEffect(() => {
    setStatus("normal");
  }, [data.email, data.password]);
  let router = useRouter();

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
      if (!props.onLogin) {
        result.data.user.user_metadata.username
          ? router.push(`/s/${result.data.user.user_metadata.username}`)
          : router.push("/setup");
      } else
        props.onLogin(result.data.user.user_metadata as { username?: string });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <img
        className="rounded-md"
        width={"216px"}
        alt="a desktop covered in tictures, paper, and plants"
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
        <label className="flex flex-col-reverse gap-1 font-bold">
          <input
            type="password"
            value={data.password}
            required
            onChange={(e) =>
              setData({ ...data, password: e.currentTarget.value })
            }
          />
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
