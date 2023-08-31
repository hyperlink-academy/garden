import { ButtonPrimary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Status = "normal" | "invalidEmail" | "confirm" | "loading";
export default function SignupPage() {
  return <SignupForm />;
}
export function SignupForm(props: { redirectTo?: string }) {
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
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h2>Great — please check your email 📬⚡️</h2>
        <p>Click the link there to confirm your account & pick a username!</p>
      </div>
    );

  return (
    <div className="grid-rows-max mx-auto grid max-w-md gap-8">
      <div className="grid-auto-rows grid gap-2">
        <h1>Hi, welcome to Hyperlink!</h1>
        <p className="text-grey-35">
          Already have an account?{" "}
          <Link className="text-accent-blue" href="/login">
            Log in
          </Link>{" "}
          instead ✨
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid w-full gap-4">
        <ErrorMessage status={status} />
        <label className="grid-flow-rows grid gap-2 font-bold">
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
        <label className="grid-flow-rows grid gap-2 font-bold">
          Password
          <PasswordInput
            value={input.password}
            onChange={(e) => setInput({ ...input, password: e })}
          />
        </label>
        {/* fix for gap added by PasswordInput hide/show button */}
        <div className="grid-rows-max -mt-4 grid justify-items-end">
          <ButtonPrimary
            className="content-end items-end justify-end justify-items-end self-end justify-self-end"
            type="submit"
            content={status === "loading" ? "" : "Sign Up!"}
            icon={status === "loading" ? <DotLoader /> : undefined}
          />
        </div>
      </form>
      <div className="flex flex-col gap-2 rounded-md bg-bg-gold p-4 text-center">
        <p className="text-grey-15">
          we will <strong>only</strong> email you about your account
        </p>
        <p>
          to get our newsletter too,{" "}
          <a
            href="https://buttondown.email/hyperlink/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue"
          >
            subscribe here 💌
          </a>
        </p>
      </div>
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
    <div>
      <input
        required
        minLength={8}
        className="relative w-full"
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
        relative
        top-[-32px]
        left-[-16px]
        float-right
        cursor-pointer
        hover:cursor-pointer`}
      >
        {visible ? "hide" : "show"}
      </button>
    </div>
  );
}
