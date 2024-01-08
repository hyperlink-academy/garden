import { createClient } from "backend/lib/supabase";
import { Env } from "..";

export async function isUserMember(env: Env, userID: string) {
  let supabase = createClient(env.env);
  let { data: isMember } = await supabase
    .from("members_in_spaces")
    .select("*")
    .eq("space_do_id", env.id)
    .eq("member", userID);
  return !!isMember;
}
