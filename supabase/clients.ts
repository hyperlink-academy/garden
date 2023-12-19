import { createBrowserClient } from "@supabase/ssr";
import { Database } from "backend/lib/database.types";

export function supabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
