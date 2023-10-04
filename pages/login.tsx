import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import Link from "next/link";
import { ModalSubmitButton } from "components/Modal";

export default function LoginPage() {
  let router = useRouter();
  return (
    <LoginForm
      onLogin={(s) => {
        s.username ? router.push(`/s/${s.username}`) : router.push("/setup");
      }}
    />
  );
}

export function LoginForm(props: {
  onLogin: (s: { username?: string }) => void;
  onClose?: () => void;
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
    <div className="grid-auto-rows mx-auto grid max-w-md gap-8">
      <h1>Hi, welcome back!</h1>
      <form className="grid w-full gap-4" onSubmit={onSubmit}>
        {status === "normal" || status === "loading" ? null : status ===
          "incorrect" ? (
          <div className="text-accent-red">
            Your email or password is incorrect.
          </div>
        ) : (
          <ResendEmail {...data} />
        )}
        <label className="grid-flow-rows grid gap-2 font-bold">
          Email
          <input
            className="w-[100%]]"
            type="email"
            required
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
          />
        </label>
        <label className="grid-flow-rows grid gap-2 font-bold">
          Password
          <input
            type="password"
            value={data.password}
            required
            onChange={(e) =>
              setData({ ...data, password: e.currentTarget.value })
            }
          />
        </label>

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
          <div className="grid-rows-max grid justify-items-end">
            <ButtonPrimary
              className="content-end items-end justify-end justify-items-end self-end justify-self-end"
              content={status === "loading" ? "" : "Log In!"}
              icon={status === "loading" ? <DotLoader /> : undefined}
              type="submit"
            />
          </div>
        )}
        {/* <Divider /> */}
        <div className="mt-4 flex gap-2">
          <div className="w-1/2 self-center rounded-md bg-bg-red p-4 sm:w-full">
            <p className="text-grey-15">
              lost your password?{" "}
              <Link className="text-accent-blue" href={`/reset-password`}>
                reset it here
              </Link>
            </p>
          </div>
          <div className="w-1/2 self-center rounded-md bg-bg-gold p-4 sm:w-full">
            <p className="text-grey-15">
              {" "}
              new to Hyperlink? <br />
              <Link className="text-accent-blue" href="/signup">
                sign up!
              </Link>{" "}
            </p>
          </div>
        </div>
      </form>
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
