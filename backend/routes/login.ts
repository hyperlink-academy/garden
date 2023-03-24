import { z } from "zod";
import { Bindings } from "backend";
import { Client } from "faunadb";
import bcrypt from "bcryptjs";
import { ExtractResponse, makeRoute } from "backend/lib/api";
import { createSession } from "backend/fauna/resources/functions/create_new_session";
import { getIdentityByUsername } from "backend/fauna/resources/functions/get_identity_by_username";
import { AuthResponse, createClient } from "@supabase/supabase-js";

const Errors = {
  noUser: "noUser",
  incorrectPassword: "incorrectPassword",
  insecureContext: "insecureContext",
} as const;

export type LoginResponse = ExtractResponse<typeof LoginRoute>;
export const LoginRoute = makeRoute({
  route: "login",
  input: z.object({
    username: z.string(),
    password: z.string(),
  }),
  handler: async (msg, env: Bindings, _request: Request) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    const supabase = createClient(
      "https://epzrqdtswyqvjtketjhe.supabase.co",
      env.SUPABASE_API_TOKEN
    );

    let existingUser = await getIdentityByUsername(fauna, {
      username: msg.username.toLowerCase(),
    });
    if (!existingUser)
      return { data: { success: false, error: Errors.noUser } } as const;

    let hashedPassword = await bcrypt.hash(msg.password, existingUser.salt);
    if (hashedPassword !== existingUser.hashedPassword)
      return {
        data: { success: false, error: Errors.incorrectPassword },
      } as const;
    let newToken = crypto.randomUUID?.();

    let supabaseLogin = await supabase.auth.signInWithPassword({
      email: existingUser.email,
      password: msg.password,
    });
    if (supabaseLogin.error) {
      await supabase.auth.admin.createUser({
        email: existingUser.email,
        password: msg.password,
        email_confirm: true,
        user_metadata: {
          username: existingUser.username,
          studio: existingUser.studio,
        },
      });
      supabaseLogin = await supabase.auth.signInWithPassword({
        email: existingUser.email,
        password: msg.password,
      });
    }

    let session = await createSession(fauna, {
      username: existingUser.username,
      userAgent: "",
      createdAt: Date.now().toString(),
      studio: existingUser.studio,
      id: newToken,
    });
    if (!session.success)
      return {
        data: {
          success: false,
          error: session.error,
          supabaseLogin: supabaseLogin as AuthResponse | undefined,
        },
      } as const;

    return {
      data: {
        success: true,
        token: newToken,
        session: session.data,
        supabaseLogin: supabaseLogin as AuthResponse | undefined,
      },
    } as const;
  },
});
