import { z } from "zod";
import { Bindings } from "backend";
import bcrypt from "bcryptjs";
import { ExtractResponse, makeRoute } from "backend/lib/api";
import { AuthResponse } from "@supabase/supabase-js";
import { createClient } from "backend/lib/supabase";

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
    const supabase = createClient(env);

    let supabaseLogin = await supabase.auth.signInWithPassword({
      email: msg.email,
      password: msg.password,
    });
    if (supabaseLogin.error) {
      let { data: existingUser } = await supabase
        .from("old_identities")
        .select("*")
        .eq("email", msg.email)
        .single();
      if (!existingUser)
        return { data: { success: false, error: Errors.noUser } } as const;

      let compare = await bcrypt.compare(
        msg.password,
        existingUser.hashed_password
      );

      if (!compare)
        return {
          data: { success: false, error: Errors.incorrectPassword },
        } as const;

      let { data: existingUserData } = await supabase
        .from("identity_data")
        .select("*")
        .eq("username", existingUser.username)
        .single();

      if (!existingUserData)
        return {
          data: {
            success: false,
            error: "Un migrated user please contact the hyperlink team",
          },
        } as const;

      await supabase.auth.admin.updateUserById(existingUserData.id, {
        password: msg.password,
      });

      await supabase.from("old_identities").delete().eq("email", msg.email);

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
