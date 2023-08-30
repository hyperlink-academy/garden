import {
  SupabaseClientOptions,
  createClient as supabaseCreateClient,
} from "@supabase/supabase-js";
import { Database } from "./database.types";

export const createClient = (
  env: { SUPABASE_API_TOKEN: string; SUPABASE_URL: string },
  options?: SupabaseClientOptions<any>
) =>
  supabaseCreateClient<Database>(env.SUPABASE_URL, env.SUPABASE_API_TOKEN, {
    auth: {
      persistSession: false,
    },
    ...options,
  });
