import { createClient } from "backend/lib/supabase";
import { Env } from "..";

export const isMember = async (
  supabase: ReturnType<typeof createClient>,
  env: Env,
  id: string
) => {
  let space_type = await env.storage.get<string>("meta-space-type");
  if (space_type === "studio") {
    let { data } = await supabase
      .from("members_in_studios")
      .select("member, studios!inner(do_id)")
      .eq("member", id)
      .eq("studios.do_id", env.id)
      .single();
    return !!data;
  } else {
    let { data } = await supabase
      .from("members_in_spaces")
      .select("member")
      .eq("member", id)
      .eq("space_do_id", env.id)
      .single();
    return !!data;
  }
};
