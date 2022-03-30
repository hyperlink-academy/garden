import { callAPI } from "backend/lib/api";
import { useState } from "react";
import useSWR from "swr";

export default function LoginPage() {
  let [data, setData] = useState({
    username: "",
    password: "",
  });

  let { data: auth, mutate } = useSWR("session", async () => {
    return callAPI.query(
      process.env.NEXT_PUBLIC_WORKER_URL as string,
      "session"
    );
  });
  console.log(auth);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await callAPI.mutation(
      process.env.NEXT_PUBLIC_WORKER_URL as string,
      "login",
      data
    );
    mutate();
  };
  return (
    <div>
      <form className="grid gap-2" onSubmit={onSubmit}>
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
        <button className="border-2 p-2" type="submit">
          submit
        </button>
      </form>
      <button
        className="border-2 p-2"
        onClick={async () => {
          await callAPI.mutation(
            process.env.NEXT_PUBLIC_WORKER_URL as string,
            "logout",
            {}
          );
          mutate();
        }}
      >
        logout
      </button>
    </div>
  );
}
