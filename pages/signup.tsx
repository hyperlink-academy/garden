import { ButtonPrimary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SignupPage() {
  let [status, setStatus] = useState<
    "normal" | "invalidUsernameOrEmail" | "invalidToken" | "confirm"
  >("normal");
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
  }, [session]);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let { data } = await signup({
      email: input.email,
      password: input.password,
    });
    if (data.user && !data.session) setStatus("confirm");
  };
  if (status === "confirm")
    return <div>Check your email to confirm your account</div>;

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
          Email
          <input
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
        autoComplete="new-password"
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
