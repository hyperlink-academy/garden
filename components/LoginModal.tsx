"use client";
import { Modal } from "./Modal";
import { useEffect, useState } from "react";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { ModalSubmitButton } from "components/Modal";
import { DotLoader } from "components/DotLoader";
import { supabaseBrowserClient } from "supabase/clients";

import Image from "next/image";
import signupSpotIllo from "public/img/spotIllustration/signup.png";
import loginSpotIllo from "public/img/spotIllustration/login.png";
import checkMailSpotIllo from "public/img/spotIllustration/checkMail.png";

export const LoginButton = (props: { small?: boolean }) => {
  let [state, setState] = LoginOrSignupModal.useState("closed");
  return (
    <>
      <ButtonPrimary
        content="Log In"
        className={`${props.small && "!py-[1px] !text-sm"}`}
        onClick={() => setState("login")}
      />
      <LoginOrSignupModal state={state} setState={setState} />
    </>
  );
};

export const LoginOrSignupModal = (props: {
  state: "login" | "signup" | "closed";
  setState: (s: "login" | "signup" | "closed") => void;
  onLogin?: (s: {
    id: string;
    username?: string;
    authToken: {
      access_token: string;
      refresh_token: string;
    };
  }) => void;
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
            if (props.onLogin) {
              props.onLogin(s);
            }
          }}
          onClose={() => props.setState("closed")}
          onSwitchToSignUp={() => props.setState("signup")}
          redirectTo={props.redirectTo}
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
  "lightBorder flex w-full items-center bg-white  justify-center gap-2 px-2 py-2 hover:border-accent-blue hover:bg-bg-blue";
export const OAuth = (props: { actionLabel: string; redirectTo?: string }) => {
  let supabase = supabaseBrowserClient();
  return (
    <div className="LogInSSO text-grey-35 flex flex-col gap-2 font-bold">
      <button
        className={buttonClass}
        onClick={() =>
          supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: props.redirectTo,
            },
          })
        }
      >
        <img src="/sso/google.svg" width={16} alt="google" />
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
  onLogin?: (s: {
    id: string;
    username?: string;
    authToken: {
      access_token: string;
      refresh_token: string;
    };
  }) => void;
  redirectTo?: string;
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
    if (!result?.data?.user || !result.data.session) setStatus("incorrect");
    else {
      setStatus("normal");
      if (!props.onLogin) {
        result.data.user.user_metadata.username
          ? router.push(`/s/${result.data.user.user_metadata.username}`)
          : router.push("/setup");
      } else
        props.onLogin({
          id: result.data.user.id,
          username: result.data.user.user_metadata.username as string,
          authToken: result.data.session,
        });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <Image
        priority
        className="rounded-md"
        width={216}
        alt="a desktop covered in tictures, paper, and plants"
        src={loginSpotIllo}
      />
      <div className="mt-4 flex items-baseline justify-between">
        <h2 className="text-grey-15">Log in</h2>{" "}
        <p>
          or{" "}
          <button
            className="text-accent-blue font-bold hover:underline"
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
              className="text-accent-blue font-normal
            "
              href={`/reset-password`}
            >
              <p className="">reset</p>
            </Link>
          </div>
        </label>
        {status === "normal" || status === "loading" ? null : status ===
          "incorrect" ? (
          <div className="text-accent-red text-sm">
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
      <div className="LogInDivider text-grey-80 flex items-center gap-2 py-2">
        <hr className="grow" />{" "}
        <p className="text-grey-55 shrink-0 italic">or</p>
        <hr className="grow" />
      </div>
      <OAuth actionLabel="Log In" redirectTo={props.redirectTo} />
    </div>
  );
}

const ResendEmail = (props: { email: string; password: string }) => {
  let { login, signup } = useAuth();
  let [status, setStatus] = useState<"normal" | "loading" | "sent">("normal");
  return (
    <div>
      You need to confirm your email.
      {status === "loading" ? (
        <div>
          <div className="lightBorder bg-bg-blue text-grey-55 flex w-full place-items-center justify-center py-1 font-bold">
            <DotLoader />
          </div>
        </div>
      ) : status === "sent" ? (
        <div className="lightBorder bg-bg-blue text-grey-55 flex w-full place-items-center justify-center py-1 font-bold">
          <p>sent!</p>
        </div>
      ) : (
        <ButtonLink
          content="Resend confirmation email?"
          onClick={async () => {
            setStatus("loading");
            let result = await signup({
              email: props.email,
              password: props.password,
            });
            setStatus("sent");
          }}
        />
      )}
    </div>
  );
};

export function SignupForm(props: {
  redirectTo?: string;
  onClose?: () => void;
  onSwitchToLogIn?: () => void;
}) {
  let [status, setStatus] = useState<Status>("normal");
  let [input, setInput] = useState({
    password: "",
    email: "",
  });
  useEffect(() => {
    setStatus("normal");
  }, [input]);
  let { signup, session } = useAuth();
  let router = useRouter();
  useEffect(() => {
    if (session.loggedIn) {
      if (!session?.session?.username) router.push("/setup");
      else router.push(`/s/${session?.session?.username}`);
    }
  }, [session, router]);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    let { data, error } = await signup({
      redirectTo: props.redirectTo,
      email: input.email,
      password: input.password,
    });
    if (error?.message === "User already registered") setStatus("invalidEmail");
    if (data.user && !data.session) setStatus("confirm");
  };
  if (status === "confirm")
    return (
      <div className="signUpConfirmEmail flex w-full flex-col gap-2">
        <Image
          priority
          className=""
          width={220}
          alt="an overgrown USPS collection box"
          src={checkMailSpotIllo}
        />
        <h3>Confirm your email! </h3>
        <p>
          We sent a confirmation link to{" "}
          <span className="font-bold">{input.email}</span>{" "}
        </p>
        <hr className="text-grey-80 my-2" />
        <div className="lightBorder bg-bg-blue flex flex-col gap-2 p-3">
          <a
            href="https://buttondown.email/hyperlink/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue font-bold"
          >
            And subscribe to our newsletter 💌
          </a>
          <p className="text-grey-55">
            for occasional announcements & updates — otherwise we{" "}
            <strong>only</strong> email about your account
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex w-full flex-col gap-2">
      <Image
        priority
        className="rounded-md"
        width={216}
        alt="a boat soaring over a pastoral plain"
        src={signupSpotIllo}
      />
      <div className="flex items-baseline justify-between gap-1 pt-4">
        <h2 className="text-grey-15">Sign Up!</h2>
        <p className="text-grey-55">
          or{" "}
          <button
            className="text-accent-blue font-bold hover:underline"
            onClick={() => {
              if (props.onSwitchToLogIn) {
                props.onSwitchToLogIn();
              } else router.push("/login");
            }}
          >
            log in
          </button>
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 ">
        <ErrorMessage status={status} />
        <label className="flex w-full flex-col gap-1 font-bold">
          Email
          <input
            className="font-normal"
            required
            minLength={7}
            type="email"
            value={input.email}
            onChange={(e) =>
              setInput({ ...input, email: e.currentTarget.value })
            }
          />
        </label>
        <label className="flex w-full flex-col gap-1 font-bold">
          Password
          <PasswordInput
            value={input.password}
            onChange={(e) => setInput({ ...input, password: e })}
          />
        </label>
        {/* fix for gap added by PasswordInput hide/show button */}

        {props.onClose ? (
          <ModalSubmitButton
            content={status === "loading" ? "" : "Sign Up!"}
            icon={status === "loading" ? <DotLoader /> : undefined}
            onClose={() => {
              if (props.onClose) {
                props.onClose();
              }
            }}
          />
        ) : (
          <ButtonPrimary
            className="signUpSubmit float-right mt-4 content-end items-end justify-end justify-items-end self-end justify-self-end"
            type="submit"
            content={status === "loading" ? "" : "Sign Up!"}
            icon={status === "loading" ? <DotLoader /> : undefined}
          />
        )}
      </form>
      <div className="signUpDivider text-grey-80 flex items-center gap-2 py-2">
        <hr className="grow" />{" "}
        <p className="text-grey-55 shrink-0 italic">or</p>
        <hr className="grow" />
      </div>
      <OAuth actionLabel="Sign Up" redirectTo={props.redirectTo} />
      {/* <div className="flex flex-col gap-2 rounded-md bg-bg-gold p-4 text-center">
        <p className="text-grey-15">
          we&apos;ll <strong>only</strong> email about your account
        </p>
        <p>
          want to get our newsletter?{" "}
          <a
            href="https://buttondown.email/hyperlink/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue"
          >
            <br />
            subscribe here 💌
          </a>
        </p>
      </div> */}
    </div>
  );
}

type Status = "normal" | "invalidEmail" | "confirm" | "loading";
function ErrorMessage(props: { status: Status }) {
  switch (props.status) {
    case "normal":
      return null;
    case "invalidEmail":
      return (
        <div className="text-accent-red">
          <span> An account already exists with that email</span>
        </div>
      );
    default:
      return null;
  }
}

function PasswordInput(props: {
  value: string;
  onChange: (value: string) => void;
}) {
  let [visible, setVisible] = useState(false);
  return (
    <div className="signupPassword relative">
      <input
        required
        minLength={8}
        className="signupPasswordInput relative w-full pr-16 font-normal"
        autoComplete="new-password"
        value={props.value}
        type={visible ? "text" : "password"}
        onChange={(e) => props.onChange(e.currentTarget.value)}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setVisible(!visible);
        }}
        className={`
        absolute
        right-[16px]
        top-[10px]
        cursor-pointer
        hover:cursor-pointer`}
      >
        {visible ? "hide" : "show"}
      </button>
    </div>
  );
}
