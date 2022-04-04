import { useAuth } from "hooks/useAuth";
import { useState } from "react";

export default function LoginPage() {
  let [data, setData] = useState({
    username: "",
    password: "",
  });

  let { login, logout } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let session = await login(data);
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
          await logout();
        }}
      >
        logout
      </button>
    </div>
  );
}
