import { SignupPageForm } from "./SetupForm";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "supabase/server";

export const metadata = {
  title: "Signup",
};

export default async function SignupPage() {
  let session = await supabaseServerClient().auth.getSession();
  if (!session.data) return redirect("/");
  if (session.data.session?.user.user_metadata.username) {
    return redirect(`/s/${session.data.session?.user.user_metadata.username}`);
  }
  return <SignupPageForm />;
}
