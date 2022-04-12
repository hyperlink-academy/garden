import { workerAPI } from "backend/lib/api";
import { useRouter } from "next/router";
import { useState } from "react";
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
    <div>
      {signup_token.signup_token.message ? (
        <div className="max-w-sm m-auto border p-2 my-4">
          <pre className="whitespace-pre-wrap">
            {signup_token.signup_token.message}
          </pre>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="grid gap-2">
        <label className="flex gap-2 align-middle">
          username:
          <input
            className="border-2 p-2"
            type="text"
            value={data.username}
            onChange={(e) =>
              setData({ ...data, username: e.currentTarget.value })
            }
          />
        </label>
        <label className="flex gap-2 align-middle">
          email:
          <input
            className="border-2 p-2"
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
          />
        </label>
        <label className="flex gap-2 align-middle">
          password:
          <input
            className="border-2 p-2"
            type="password"
            value={data.password}
            onChange={(e) =>
              setData({ ...data, password: e.currentTarget.value })
            }
          />
        </label>
        <label className="flex gap-2 align-middle">
          confirm password:
          <input
            className="border-2 p-2"
            type="password"
            value={data.confirmPassword}
            onChange={(e) =>
              setData({ ...data, confirmPassword: e.currentTarget.value })
            }
          />
        </label>
        <button className="border-2 p-2" type="submit">
          submit
        </button>
      </form>
    </div>
  );
}
