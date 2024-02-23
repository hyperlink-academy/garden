"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "supabase/server";

export async function login(login_data: {
  email: string;
  password: string;
  redirectTo?: string;
}) {
  let supabase = supabaseServerClient();
  const { error, data } = await supabase.auth.signInWithPassword(login_data);

  revalidatePath("/", "layout");
  if (login_data.redirectTo) redirect(login_data.redirectTo);
  return { error, data };
}
