import { z } from "zod";
import { Bindings } from "backend";
import { Client } from "faunadb";
import bcrypt from "bcryptjs";
import { ExtractResponse, makeRoute } from "backend/lib/api";
import { getIdentityByUsername } from "backend/fauna/resources/functions/get_identity_by_username";
import { AuthResponse, createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";

const Errors = {
  noUser: "noUser",
  incorrectPassword: "incorrectPassword",
  insecureContext: "insecureContext",
} as const;

export type LoginResponse = ExtractResponse<typeof LoginRoute>;
export const LoginRoute = makeRoute({
  route: "login",
  input: z.object({
    email: z.string(),
    password: z.string(),
  }),
  handler: async (msg, env: Bindings, _request: Request) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );

    let supabaseLogin = await supabase.auth.signInWithPassword({
      email: msg.email,
      password: msg.password,
    });
    if (supabaseLogin.error) {
      let existingUser = await getIdentityByUsername(fauna, {
        username: msg.email.toLowerCase(),
      });
      if (!existingUser)
        return { data: { success: false, error: Errors.noUser } } as const;

      let hashedPassword = await bcrypt.hash(msg.password, existingUser.salt);
      if (hashedPassword !== existingUser.hashedPassword)
        return {
          data: { success: false, error: Errors.incorrectPassword },
        } as const;

      let { data } = await supabase.auth.admin.createUser({
        email: existingUser.email,
        password: msg.password,
        email_confirm: true,
        user_metadata: {
          username: existingUser.username,
          studio: existingUser.studio,
        },
      });
      if (data.user)
        await supabase.from("identity_data").insert({
          id: data.user.id,
          username: existingUser.username,
          studio: existingUser.studio,
        });
      supabaseLogin = await supabase.auth.signInWithPassword({
        email: existingUser.email,
        password: msg.password,
      });
    }

    if (supabaseLogin.error || !supabaseLogin.data)
      return {
        data: {
          success: false,
          error: supabaseLogin.error?.message,
          supabaseLogin: supabaseLogin as AuthResponse | undefined,
        },
      } as const;

    return {
      data: {
        success: true,
        session: supabaseLogin.data,
        supabaseLogin: supabaseLogin as AuthResponse | undefined,
      },
    } as const;
  },
});
