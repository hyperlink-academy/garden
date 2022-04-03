import { workerAPI } from "backend/lib/api";
import { SessionResponse } from "backend/routes/session";
import { createContext, useContext } from "react";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

const AuthContext = createContext({
  session: { loggedIn: false } as SessionResponse,
  login: async (_data: { username: string; password: string }) => {
    return false as boolean;
  },
  logout: async () => {
    return false as boolean;
  },
});

export const AuthProvider: React.FC = (props) => {
  let { data, mutate } = useSWR("session", async () => {
    let token = localStorage.getItem("auth");
    if (!token) return { loggedIn: false } as const;
    let data = await workerAPI(WORKER_URL, "session", { token });
    if (!data.loggedIn) localStorage.removeItem("auth");
    return data;
  });
  if (!data) return <div>loading</div>;
  return (
    <AuthContext.Provider
      value={{
        session: data,
        login: async (data: { username: string; password: string }) => {
          let token = localStorage.getItem("auth");
          if (token) return true;
          let res = await workerAPI(WORKER_URL, "login", data);
          if (res.success) {
            localStorage.setItem("auth", res.token);
            mutate({ loggedIn: true, session: res.session, token: res.token });
          }
          return res.success;
        },
        logout: async () => {
          let token = localStorage.getItem("auth");
          if (!token) return true;
          await workerAPI(WORKER_URL, "logout", { token });
          mutate();
          localStorage.removeItem("auth");
          return true;
        },
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
