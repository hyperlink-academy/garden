import { workerAPI } from "backend/lib/api";
import { LoginResponse } from "backend/routes/login";
import { SessionResponse } from "backend/routes/session";
import { createContext, useContext } from "react";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const AuthContext = createContext({
  session: { loggedIn: false } as SessionResponse,
  login: async (_data: { username: string; password: string }) => {
    return {} as unknown as LoginResponse;
  },
  logout: async () => {
    return false as boolean;
  },
});

export const AuthProvider: React.FC<React.PropsWithChildren<unknown>> = (
  props
) => {
  let { data, mutate } = useSWR("persist-session", async () => {
    let token = localStorage.getItem("auth");
    if (!token) return { loggedIn: false } as const;
    let data = await workerAPI(WORKER_URL, "session", { token });
    if (!data.loggedIn) localStorage.removeItem("auth");
    return data;
  });

  if (!data) return null;
  return (
    <AuthContext.Provider
      value={{
        session: data,
        login: async (login_data: { username: string; password: string }) => {
          if (data?.loggedIn)
            return {
              success: true,
              token: data.token,
              session: data.session,
              supabaseLogin: undefined,
            };
          let res = await workerAPI(WORKER_URL, "login", login_data);
          if (res.success) {
            localStorage.setItem("auth", res.token);
            mutate({ loggedIn: true, session: res.session, token: res.token });
          }
          return res;
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
