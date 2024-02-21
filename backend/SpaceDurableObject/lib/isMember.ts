import { createClient } from "backend/lib/supabase";

export async function isUserMember(
  env: {
    env: { SUPABASE_API_TOKEN: string; SUPABASE_URL: string };
    id: string;
  },
  userID: string
) {
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
    isMember &&
    (isMember.members_in_spaces.length > 0 ||
      isMember.members_in_studios.length > 0)
  );
}

export function isAuthorized(env: Env, userID: string) {
  return env.id === userID;
}
