import { LoginForm } from "components/LoginModal";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "supabase/server";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  let session = await supabaseServerClient().auth.getSession();
  if (session.data.session) {
    let username = session.data.session.user.user_metadata.username;
    if (username)
      return redirect(
        `/s/${session.data.session?.user.user_metadata.username}`
      );
    else return redirect(`/setup`);
  }
  return (
    <div className=" -my-4 mx-auto flex h-screen  max-w-md flex-col items-center justify-center gap-4">
      <h2 className="w-full">
        Welcome Back to{" "}
        <Link className="text-accent-blue hover:underline" href="/">
          Hyperlink
        </Link>
        !
      </h2>
      <div className="lightBorder w-full bg-white p-4">
        <LoginForm />
      </div>
    </div>
  );
}
