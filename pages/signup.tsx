import { workerAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { FloatingContainer } from "components/Layout";
import { useRouter } from "next/router";
import { ReactChild, useState } from "react";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function SignupPage() {
  let router = useRouter();
  let [data, setData] = useState({
    username: "",
    password: "",
    email: "",
    confirmPassword: "",
  });
  const code = router.query.signupCode as string | undefined;
  let { data: signup_token } = useSWR(code, async (c) => {
    if (!code) return { success: false } as const;
    let data = await workerAPI(WORKER_URL, "get_signup_token", { code: c });
    return data;
  });
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    await workerAPI(WORKER_URL, "signup", {
      code: code,
      email: data.email,
      password: data.password,
      username: data.username,
    });
  };

  if (!signup_token) return "loading";
  if (!signup_token.success)
    return <div>We're currently invite only! You need a code to sign up</div>;
  return (
    <div className="grid grid-rows-max gap-8 mx-auto max-w-md">
      <div className="grid grid-auto-rows gap-2">
        <h1>Hello and Welcome!</h1>
        <p className="text-grey-35">
          <a className="text-accent-blue" href="/login">
            Log in
          </a>{" "}
          instead
        </p>
      </div>

      {signup_token.signup_token.message ? (
        <FloatingContainer className="max-w-sm m-auto">
          <pre className="whitespace-pre-wrap font-[Quattro] italic text-grey-35">
            {signup_token.signup_token.message}
          </pre>
        </FloatingContainer>
      ) : null}
      <form onSubmit={onSubmit} className="grid gap-4 w-full">
        <label className="grid grid-flow-rows gap-2 font-bold">
          Username
          <input
            type="text"
            value={data.username}
            onChange={(e) =>
              setData({ ...data, username: e.currentTarget.value })
            }
          />
        </label>
        <label className="grid grid-flow-rows gap-2 font-bold">
          Email
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
          />
        </label>
        <label className="grid grid-flow-rows gap-2 font-bold">
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
        className="w-full relative"
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
        cursor-pointer
        hover:cursor-pointer
        top-[-32px]
        left-[-16px]
        float-right`}
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
