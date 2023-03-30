import { workerAPI } from "backend/lib/api";
import { useMemo, useState } from "react";
import {
  SessionContextProvider,
  useSession,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

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
          options: { emailRedirectTo: `${window.location.origin}/setup` },
        });
      },
    }),
    [session, supabaseClient.auth]
  );
};
