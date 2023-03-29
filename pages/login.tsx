import { ButtonPrimary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";

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
}) {
  let [data, setData] = useState({
    email: "",
    password: "",
  });

  let { login } = useAuth();
  let [status, setStatus] = useState<"normal" | "incorrect" | "loading">(
    "normal"
  );
  useEffect(() => {
    setStatus("normal");
  }, [data.email, data.password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    let result = await login(data);
    if (!result?.user) setStatus("incorrect");
    else {
      setStatus("normal");
      props.onLogin(result.user.user_metadata as { username?: string });
    }
  };
  return (
    <div className="grid-auto-rows mx-auto grid max-w-md gap-8">
      <h1>Hi, Welcome Back!</h1>
      <form className="grid w-full gap-4" onSubmit={onSubmit}>
        {status !== "incorrect" ? null : (
          <div className="text-accent-red">
            Your email or password is incorrect
          </div>
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
        <div className="grid-rows-max grid justify-items-end gap-2 text-right">
          <ButtonPrimary
            content={status === "loading" ? "" : "Log In!"}
            icon={status === "loading" ? <DotLoader /> : undefined}
            type="submit"
          />
          <p className="text-grey-35">
            {" "}
            or email us about signing up{" "}
            <a
              href="mailto:contact@hyperlink.academy"
              className="text-accent-blue"
            >
              contact@hyperlink.academy
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
