"use server";

import { revalidatePath } from "next/cache";
import { uuidToBase62 } from "src/uuidHelpers";
import {
  supabaseAdminServerClient,
  supabaseServerClient,
} from "supabase/server";

export async function add_space(msg: { studio_id: string; space_id: string }) {
  let supabase = supabaseServerClient();
  let { data: session } = await supabase.auth.getUser();
  console.log(session);
  if (!session?.user)
    return { success: false, error: "no user logged in" } as const;

  let { data: isMember } = await supabase
    .from("members_in_studios")
    .select()
    .eq("member", session.user.id)
    .eq("studio", msg.studio_id)
    .single();

  if (!isMember)
    return { success: false, error: "user is not a member of studio" } as const;

  let adminSupabase = supabaseAdminServerClient();
  let { data } = await adminSupabase
    .from("spaces_in_studios")
    .insert({
      studio: msg.studio_id,
      space_id: msg.space_id,
    })
    .select("*");

  revalidatePath(`/studio/${msg.studio_id}`);
  revalidatePath(`/studio/${msg.studio_id}/spaces`, "layout");
  revalidatePath(`/studio/${uuidToBase62(msg.studio_id)}`);
  revalidatePath(`/studio/${uuidToBase62(msg.studio_id)}/spaces`, "layout");

  return { data: { success: true, data } } as const;
}
