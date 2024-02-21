import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { Database } from "backend/lib/database.types";
import { cookies } from "next/headers";
export function supabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export function supabaseAdminServerClient() {
  console.log(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_API_TOKEN!
  );
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_API_TOKEN!
  );
}
