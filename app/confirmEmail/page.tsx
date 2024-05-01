import { ButtonSecondary } from "components/Buttons";
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
    return (
      <div className=" -my-4 mx-auto flex h-screen max-w-md flex-col items-center justify-center gap-4 px-3 ">
        <div className="lightBorder mt-3 flex w-full max-w-md flex-col gap-4 bg-white p-3 sm:p-4">
          Great! Please click here to confirm your email.
          <a href={props.searchParams.confirmationURL}>
            <ButtonSecondary content="Confirm Your Email!" />
          </a>
        </div>
      </div>
    );
  }
  return null;
}
