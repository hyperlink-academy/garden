import { ButtonPrimary } from "components/Buttons";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";

export default function LoginPage() {
  let [state, setState] = useState<"normal" | "new-password">("normal");
  let supabase = useSupabaseClient();
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event == "PASSWORD_RECOVERY") {
        setState("new-password");
      }
    });
  }, [supabase]);
  return (
    <div className="grid-auto-rows mx-auto grid max-w-md gap-8">
      {state === "new-password" ? <NewPasswordForm /> : <ResetPasswordForm />}
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
  let supabase = useSupabaseClient();

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
      <div className="grid-auto-rows grid gap-2">
        <h1 className="text-2xl font-bold">Password Reset</h1>
        <p className="text-gray-500">
          We've sent you an email with a link to reset your password.
        </p>
      </div>
    );
  return (
    <form className="grid w-full gap-4" onSubmit={onSubmit}>
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
          content={status === "loading" ? "" : "Reset Password"}
          icon={status === "loading" ? <DotLoader /> : undefined}
          type="submit"
        />
      </div>
    </form>
  );
}

function NewPasswordForm() {
  let supabase = useSupabaseClient();
  let [status, setStatus] = useState<"normal" | "loading">("normal");
  let [newPassword, setNewPassword] = useState("");
  let router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    await supabase.auth.updateUser({ password: newPassword });
    router.push("/");
    setStatus("normal");
  };

  return (
    <form className="grid w-full gap-4" onSubmit={onSubmit}>
      <label className="grid-flow-rows grid gap-2 font-bold">
        New Password
        <input
          className="w-[100%]]"
          type="password"
          minLength={8}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
        />
      </label>
      <div className="grid-rows-max grid justify-items-end gap-2 text-right">
        <ButtonPrimary
          content={status === "loading" ? "" : "Reset Password"}
          icon={status === "loading" ? <DotLoader /> : undefined}
          type="submit"
        />
      </div>
    </form>
  );
}