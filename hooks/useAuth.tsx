import { workerAPI } from "backend/lib/api";
import { useMemo, useState } from "react";
import {
  SessionContextProvider,
  useSession,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useIdentityData } from "./useIdentityData";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const AuthProvider: React.FC<React.PropsWithChildren<unknown>> = (
  props
) => {
  const [supabaseClient] = useState(() => createPagesBrowserClient());
  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {props.children}
    </SessionContextProvider>
  );
};
export const useAuthIdentityData = () => {
  let session = useSession();
  let { data: identityData } = useIdentityData(
    session?.user?.user_metadata.username
  );
  return { identityData };
};

export const useAuth = () => {
  const supabaseClient = useSupabaseClient();
  let session = useSession();
  let authToken = useMemo(() => {
    if (!session) return null;
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };
  }, [session?.access_token, session?.refresh_token]);

  return useMemo(
    () => ({
      authToken,
      session: {
        loggedIn: !!session,
        user: session?.user,
        session: session?.user?.user_metadata as {
          username: string;
          studio: string;
        } | null,
      },
      login: async (login_data: { email: string; password: string }) => {
        if (session) return { success: true, data: session } as const;
        let res = await workerAPI(WORKER_URL, "login", login_data);
        console.log(res);
        if (res.error === "confirmEmail") {
          return { success: false, error: "confirmEmail" } as const;
        }
        if (!res.session?.session) return null;
        let { data } = await supabaseClient.auth.setSession(
          res.session?.session
        );
        if (data) return { success: true, data };
        return { success: false, error: "no session" } as const;
      },
      logout: () => {
        supabaseClient.auth.signOut();
      },
      signup: (input: {
        email: string;
        password: string;
        redirectTo?: string;
      }) => {
        return supabaseClient.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            emailRedirectTo: `${window.location.origin}/setup${input.redirectTo ? `?redirectTo=${input.redirectTo}` : ""
              }`,
          },
        });
      },
    }),
    [session, supabaseClient.auth]
  );
};
