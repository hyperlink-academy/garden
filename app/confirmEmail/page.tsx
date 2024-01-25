import { redirect } from "next/navigation";
import { supabaseServerClient } from "supabase/server";

export default async function ConfirmEmailPage(props: {
  searchParams: { confirmationURL: string };
}) {
  let session = await supabaseServerClient().auth.getSession();

  if (session.data.session) {
    let username = session.data.session.user.user_metadata.username;
    if (username) return redirect(`/s/${username}`);
    else return redirect("/setup");
  }
  if (props.searchParams.confirmationURL) {
    return redirect(props.searchParams.confirmationURL);
  }
  return null;
}
