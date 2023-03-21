import { workerAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { FloatingContainer } from "components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactChild, useEffect, useState } from "react";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function SignupPage() {
  let router = useRouter();
  let [status, setStatus] = useState<
    "normal" | "invalidUsernameOrEmail" | "invalidToken"
  >("normal");
  let [data, setData] = useState({
    username: "",
    password: "",
    email: "",
  });
  useEffect(() => {
    setStatus("normal");
  }, [data]);
  const code = router.query.signupCode as string | undefined;
  let { data: signup_token } = useSWR(code || "", async (c) => {
    if (!code) return { success: false } as const;
    let data = await workerAPI(WORKER_URL, "get_signup_token", { code: c });
    return data;
  });
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    let res = await workerAPI(WORKER_URL, "signup", {
      code: code,
      email: data.email,
      password: data.password,
      username: data.username,
    });
    if (res.success) return router.push("/login");
    setStatus(res.error);
  };

  if (!signup_token?.success)
    return (
      <div>
        <h2 className="pb-2">
          The Garden is currently open by invitation only!
        </h2>
        <p>
          You need an invite code to sign up — please{" "}
          <a
            className="text-accent-blue"
            href="mailto:contact@hyperlink.academy"
          >
            email us
          </a>{" "}
          any ideas for experiments :)
        </p>
      </div>
    );
  return (
    <div className="grid-rows-max mx-auto grid max-w-md gap-8">
      <div className="grid-auto-rows grid gap-2">
        <h1>Hello and Welcome!</h1>
        <p className="text-grey-35">
          <Link className="text-accent-blue" href="/login">
            Log in
          </Link>{" "}
          instead
        </p>
      </div>

      {signup_token.signup_token.message ? (
        <FloatingContainer className="m-auto max-w-sm">
          <pre className="whitespace-pre-wrap font-[Quattro] italic text-grey-35">
            {signup_token.signup_token.message}
          </pre>
        </FloatingContainer>
      ) : null}
      <form onSubmit={onSubmit} className="grid w-full gap-4">
        {status === "normal" ? null : (
          <div className="text-accent-red">
            {status === "invalidToken" ? (
              <span> Your invite code is invalid</span>
            ) : (
              <span> That username or email is taken</span>
            )}
          </div>
        )}
        <label className="grid-flow-rows grid gap-2 font-bold">
          Username
          <input
            type="text"
            value={data.username}
            onChange={(e) =>
              setData({ ...data, username: e.currentTarget.value })
            }
          />
        </label>
        <label className="grid-flow-rows grid gap-2 font-bold">
          Email
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
          />
        </label>
        <label className="grid-flow-rows grid gap-2 font-bold">
          Password
          <PasswordInput
            value={data.password}
            onChange={(e) => setData({ ...data, password: e })}
          />
        </label>
        <ButtonPrimary type="submit" content="Sign Up!" />
      </form>
    </div>
  );
}

function PasswordInput(props: {
  value: string;
  onChange: (value: string) => void;
}) {
  let [visible, setVisible] = useState(false);
  return (
    <div>
      <input
        className="relative w-full"
        value={props.value}
        type={visible ? "text" : "password"}
        onChange={(e) => props.onChange(e.currentTarget.value)}
      />
      <button
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

  // position: relative;
  // &:hover {
  // cursor: pointer;
  // }
  // top: -30px;
  // left: -16px;
  // float: right;

  // h("div", { style: { width: "100%", marginBottom: "-16px" } }, [
  //   h(Input, {
  //     ...props,
  //     type: visible ? "text" : "password",
  //     style: { width: "100%", boxSizing: "border-box" },
  //   }),
  //   h(
  //     ToggleButton,
  //     {
  //       onClick: (e) => {
  //         e.preventDefault();
  //         setVisible(!visible);
  //       },
  //     },
  //     visible ? "hide" : "show"
  //   ),
  // ]);
}

// let ToggleButton = styled('button')`
// font-family: 'Roboto Mono', monospace;
// color: ${colors.textSecondary};
// outline: none;
// background-color: inherit;
// border: none;

// `
