import { ButtonPrimary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { OAuth } from "components/LoginModal";
import { ModalSubmitButton } from "components/Modal";
import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Status = "normal" | "invalidEmail" | "confirm" | "loading";
export default function SignupPage() {
  return (
    <div className=" -my-4 mx-auto flex h-screen  max-w-md flex-col items-center justify-center gap-4">
      <h1 className="w-full">
        Welcome to{" "}
        <Link className="text-accent-blue hover:underline" href="/">
          Hyperlink Academy
        </Link>
        !
      </h1>
      <div className="lightBorder w-full bg-white p-4">
        <SignupForm />
      </div>
    </div>
  );
}
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
        <img
          className=""
          width={"220px"}
          alt="an overgrown USPS collection box"
          src="/img/spotIllustration/checkMail.png"
        />
        <h2>Confirm your email! </h2>{" "}
        <p>
          {" "}
          We send a confirmation link to{" "}
          <span className="font-bold">{input.email}</span>{" "}
        </p>
      </div>
    );

  return (
    <div className="flex w-full flex-col gap-2">
      <img
        className="place-self-end"
        width={"264px"}
        alt="a small house in an overgrown field"
        src="/img/spotIllustration/welcome.png"
      />
      <div className="flex items-baseline justify-between gap-1 pt-4">
        <h2 className="text-grey-15">Sign Up!</h2>
        <p className="text-grey-55">
          or{" "}
          <button
            className="font-bold text-accent-blue hover:underline"
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
            className=" signUpSubmit  float-right mt-4 content-end items-end justify-end justify-items-end self-end justify-self-end"
            type="submit"
            content={status === "loading" ? "" : "Sign Up!"}
            icon={status === "loading" ? <DotLoader /> : undefined}
          />
        )}
      </form>
      <div className="signUpDivider flex items-center gap-2 py-2 text-grey-80">
        <hr className="grow" />{" "}
        <p className="shrink-0 italic text-grey-55">or</p>
        <hr className="grow" />
      </div>
      <OAuth actionLabel="Sign Up" />
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
        className="signupPasswordInput relative w-full pr-16"
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
