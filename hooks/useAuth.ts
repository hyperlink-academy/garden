import { callAPI } from "backend/lib/api";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export function useAuth() {
  let session = useSWR("session", async () => {
    let token = localStorage.getItem("auth");
    if (!token) return { loggedIn: false } as const;
    let data = await callAPI.mutation(WORKER_URL, "session", { token });
    if (!data.loggedIn) localStorage.removeItem("auth");
    return data
  }, {fallbackData: {loggedIn: false} as const});
  return {
    session,
    login: async (data: { username: string; password: string }) => {
      let token = localStorage.getItem("auth");
      if (token) return true;
      let res = await callAPI.mutation(WORKER_URL, "login", data);
      if (res.success) localStorage.setItem("auth", res.token);
      return res;
    },
    logout: async () => {
      let token = localStorage.getItem("auth");
      if (!token) return true;
      await callAPI.mutation(WORKER_URL, "logout", {token});
      localStorage.removeItem('auth')
      return true
    },
  };
}
