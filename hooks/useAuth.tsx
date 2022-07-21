import { workerAPI } from "backend/lib/api";
import { LoginResponse } from "backend/routes/login";
import { SessionResponse } from "backend/routes/session";
import { makeSpaceReplicache } from "components/ReplicacheProvider";
import { createContext, useContext, useEffect, useState } from "react";
import { Replicache } from "replicache";
import useSWR from "swr";
import { makeReplicache, ReplicacheMutators } from "./useReplicache";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const AuthContext = createContext({
  rep: null as null | Replicache<ReplicacheMutators>,
  session: { loggedIn: false } as SessionResponse,
  login: async (_data: { username: string; password: string }) => {
    return {} as unknown as LoginResponse;
  },
  logout: async () => {
    return false as boolean;
  },
});

export const AuthProvider: React.FC = (props) => {
  let { data, mutate } = useSWR("persist-session", async () => {
    let token = localStorage.getItem("auth");
    if (!token) return { loggedIn: false } as const;
    let data = await workerAPI(WORKER_URL, "session", { token });
    if (!data.loggedIn) localStorage.removeItem("auth");
    return data;
  });

  let [rep, setRep] = useState<ReturnType<typeof makeReplicache>>();

  useEffect(() => {
    if (!data?.loggedIn) return;
    let id = data.session.studio;
    if (!id) return;
    let rep = makeSpaceReplicache({
      id: id,
      session: id,
      token: data.token,
    });
    setRep(rep);
    return () => {
      rep.close();
    };
  }, [data?.loggedIn]);

  if (!data) return <div>loading</div>;
  return (
    <AuthContext.Provider
      value={{
        rep: rep || null,
        session: data,
        login: async (data: { username: string; password: string }) => {
          let token = localStorage.getItem("auth");
          if (token) return { success: true, token: token, session: {} as any };
          let res = await workerAPI(WORKER_URL, "login", data);
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
