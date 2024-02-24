import { workerAPI } from "backend/lib/api";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useIdentityData } from "./useIdentityData";
import { supabaseBrowserClient } from "supabase/clients";
import { Session } from "@supabase/supabase-js";
import { login } from "backend/actions/login";

let SessionContext = createContext<Session | null>(null);

export const AuthProvider = (props: {
  children: React.ReactNode;
  session: Session | null;
}) => {
  let [session, setSession] = useState(props.session);
  let supabase = supabaseBrowserClient();
  useEffect(() => {
    let subscription = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.data.subscription.unsubscribe();
  }, [supabase.auth]);
  return (
    <SessionContext.Provider value={session}>
      {props.children}
    </SessionContext.Provider>
  );
};

let useSession = () => useContext(SessionContext);

export const useAuthIdentityData = () => {
  let session = useSession();
  let { data: identityData } = useIdentityData(
    session?.user?.user_metadata.username
  );
  return { identityData };
};

export const useAuth = () => {
  const supabaseClient = supabaseBrowserClient();
  let session = useSession();
  let authToken = useMemo(() => {
    if (!session) return null;
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };
  }, [session]);

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
      login: async (login_data: {
        email: string;
        password: string;
        redirectTo?: string;
      }) => {
        if (session) return { success: true } as const;
        let res = await login(login_data);
        if (res.error?.message === "Email not confirmed") {
          return { success: false, error: "confirmEmail" } as const;
        }
        if (res.data) return { success: true, data: res.data };
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
            emailRedirectTo: `${window.location.origin}/setup${
              input.redirectTo ? `?redirectTo=${input.redirectTo}` : ""
            }`,
          },
        });
      },
    }),
    [session, supabaseClient.auth, authToken]
  );
};
