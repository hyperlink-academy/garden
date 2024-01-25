"use client";
import { ButtonPrimary } from "components/Buttons";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "supabase/clients";
import { useAuth } from "hooks/useAuth";

export default function LoginPage() {
  let [state, setState] = useState<"normal" | "new-password" | "signed-in">(
    "normal"
  );
  let { session } = useAuth();
  let supabase = supabaseBrowserClient();
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event == "PASSWORD_RECOVERY") {
        setState("new-password");
      }
      if (event === "SIGNED_IN") {
        setState("signed-in");
      }
    });
  }, [supabase]);
  return (
    <div className="mx-auto -mt-4 flex h-[calc(100vh-1rem)] max-w-md items-center">
      <div className="lightBorder h-fit w-full bg-white p-4">
        {state === "new-password" ||
        state === "signed-in" ||
        session.session ? (
          <NewPasswordForm />
        ) : (
          <ResetPasswordForm />
        )}
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  let [data, setData] = useState({
    email: "",
  });

  let [status, setStatus] = useState<
    "normal" | "loading" | "sent" | "new-password"
  >("normal");
  let supabase = supabaseBrowserClient();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setStatus("sent");
  };

  if (status === "new-password") return <NewPasswordForm />;

  if (status === "sent")
    return (
      <div className="resetPasswordInstructions grid-auto-rows grid gap-4">
        <h2 className="">Thanks!</h2>
        <p className="text-grey-15">
          Check <span className="font-bold">{data.email} </span>for a link to
          reset your password.
        </p>
        <p className="text-grey-15">
          Not seeing it within a few minutes?{" "}
          <a
            href="mailto:contact@hyperlink.academy"
            className="text-accent-blue"
          >
            Email us!
          </a>
        </p>
      </div>
    );
  return (
    <form
      className="resetPasswordRequestForm flex w-full flex-col gap-4"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-1">
        <h3>Reset Password</h3>
        <p>We&apos;ll email you a link to reset your password!</p>
      </div>
      <label className="grid-flow-rows grid gap-2 font-bold">
        Email
        <input
          className="w-[100%]]"
          type="email"
          required
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
        />
      </label>
      <div className="grid-rows-max grid justify-items-end gap-2 text-right">
        <ButtonPrimary
          content={status === "loading" ? "" : "Send Reset Link"}
          icon={status === "loading" ? <DotLoader /> : undefined}
          type="submit"
        />
      </div>
    </form>
  );
}

function NewPasswordForm() {
  let supabase = supabaseBrowserClient();
  let [status, setStatus] = useState<"normal" | "loading">("normal");
  let [newPassword, setNewPassword] = useState("");
  let router = useRouter();
  let [visible, setVisible] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    await supabase.auth.updateUser({ password: newPassword });
    let { data: user } = await supabase.auth.getUser();
    console.log(user);
    if (!user.user?.user_metadata.username) router.push("/setup");
    else router.push(`/s/${user.user?.user_metadata?.username}`);
  };

  return (
    <form
      className="resetPasswordSetNewForm flex w-full flex-col gap-4"
      onSubmit={onSubmit}
    >
      <label className="flex flex-col gap-2 font-bold">
        Set a New Password
        <div className="relative">
          <input
            className="signupPasswordInput  w-full pr-16"
            type={visible ? "text" : "password"}
            minLength={8}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setVisible(!visible);
            }}
            className={`
            absolute
            right-[16px]
            top-[10px]
            cursor-pointer
            font-bold
            hover:cursor-pointer`}
          >
            {visible ? "hide" : "show"}
          </button>
        </div>
      </label>
      <div className="flex justify-end">
        <ButtonPrimary
          content={status === "loading" ? "" : "Reset Password"}
          icon={status === "loading" ? <DotLoader /> : undefined}
          type="submit"
        />
      </div>
    </form>
  );
}
