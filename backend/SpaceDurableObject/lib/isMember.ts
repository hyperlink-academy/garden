import { createClient } from "backend/lib/supabase";
import { Env } from "..";

export async function isUserMember(env: Env, userID: string) {
  let supabase = createClient(env.env);
  let { data: isMember } = await supabase
    .from("identity_data")
    .select(
      "members_in_spaces(space_data!inner(do_id)), members_in_studios(studios!inner(do_id))"
    )
    .eq("id", userID)
    .eq("members_in_spaces.space_data.do_id", env.id)
    .eq("members_in_studios.studios.do_id", env.id)
    .single();

  return (
    !!isMember?.members_in_spaces.length > 0 ||
    !!isMember?.members_in_studios.length > 0
  );
}
