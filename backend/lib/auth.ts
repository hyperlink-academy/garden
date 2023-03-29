import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import z from "zod";
export type authToken = z.infer<typeof authTokenVerifier>;

export const authTokenVerifier = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const verifyIdentity = async (env: Bindings, token: authToken) => {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_API_TOKEN);
  let { data: session } = await supabase.auth.setSession(token);
  if (
    session.user?.user_metadata.studio &&
    session.user.user_metadata.username
  ) {
    let metadata = session.user.user_metadata as {
      username: string;
      studio: string;
    };

    return { ...metadata, id: session.user.id };
  }
  return null;
};
