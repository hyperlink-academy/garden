import { workerAPI } from "backend/lib/api";
import { LoginResponse } from "backend/routes/login";
import { SessionResponse } from "backend/routes/session";
import { createContext, useMemo, useState } from "react";
import {
  SessionContextProvider,
  useSession,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

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
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {props.children}
    </SessionContextProvider>
  );
};

export const useAuth = () => {
  const supabaseClient = useSupabaseClient();
  let session = useSession();

  return useMemo(
    () => ({
      authToken: !session
        ? null
        : {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
      session: {
        loggedIn: !!session,
        session: session?.user?.user_metadata as {
          username: string;
          studio: string;
        } | null,
      },
      login: async (login_data: { email: string; password: string }) => {
        if (session) return session;
        let res = await workerAPI(WORKER_URL, "login", login_data);
        if (!res.session?.session) return null;
        let { data } = await supabaseClient.auth.setSession(
          res.session?.session
        );
        if (data) return data;
        return null;
      },
      logout: () => {
        supabaseClient.auth.signOut();
      },
      signup: (input: { email: string; password: string }) => {
        return supabaseClient.auth.signUp({
          email: input.email,
          password: input.password,
          options: { emailRedirectTo: "/setup" },
        });
      },
    }),
    [session]
  );
};
