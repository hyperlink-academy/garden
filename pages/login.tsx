import { ButtonPrimary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function LoginPage() {
  let [data, setData] = useState({
    username: "",
    password: "",
  });

  let { login } = useAuth();
  let router = useRouter();
  let [status, setStatus] = useState<"normal" | "incorrect">("normal");
  useEffect(() => {
    setStatus("normal");
  }, [data.username, data.password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result = await login(data);
    if (!result.success) setStatus("incorrect");
    if (result.success) router.push(`/s/${result.session.username}`);
  };
  return (
    <div className="grid grid-auto-rows gap-8 mx-auto max-w-md">
      <h1>Hi, Welcome Back!</h1>
      <form className="grid gap-4 w-full" onSubmit={onSubmit}>
        {status === "normal" ? null : (
          <div className="text-accent-red">
            Your username or password is incorrect
          </div>
        )}
        <label className="grid grid-flow-rows gap-2 font-bold">
          Username
          <input
            className="w-[100%]]"
            type="text"
            value={data.username}
            onChange={(e) =>
              setData({ ...data, username: e.currentTarget.value })
            }
          />
        </label>
        <label className="grid grid-flow-rows gap-2 font-bold">
          Password
          <input
            type="password"
            value={data.password}
            onChange={(e) =>
              setData({ ...data, password: e.currentTarget.value })
            }
          />
        </label>
        <div className="grid grid-rows-max gap-2 justify-items-end text-right">
          <ButtonPrimary content="Log In!" type="submit" />
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
