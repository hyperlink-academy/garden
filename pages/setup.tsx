import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { workerAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { useDebouncedEffect } from "hooks/utils";
import { useRouter } from "next/router";
import { useState } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function SignupPage() {
  let router = useRouter();
  let supabase = useSupabaseClient();
  let [status, setStatus] = useState<"valid" | "invalidUsername">("valid");
  let [data, setData] = useState({
    username: "",
  });

  useDebouncedEffect(
    async () => {
      let { data: existingUsername } = await supabase
        .from("identity_data")
        .select("username")
        .eq("username", data.username)
        .single();
      if (existingUsername) {
        setStatus("invalidUsername");
      } else setStatus("valid");
    },
    300,
    [data]
  );

  let { authToken: tokens } = useAuth();
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens) return;
    let res = await workerAPI(WORKER_URL, "signup", {
      username: data.username,
      tokens,
    });
    if (res.success) {
      let { data } = await supabase.auth.refreshSession();
      if (data.session) {
        await supabase.auth.setSession(data?.session);
        router.push(`/s/${data.user?.user_metadata.username}`);
      }
    }
  };

  if (!tokens) return <div>you need to signup or login</div>;

  return (
    <div className="grid-rows-max mx-auto grid max-w-md gap-8">
      <div className="grid-auto-rows grid gap-2">
        <h1>Hello and Welcome!</h1>
      </div>

      <form onSubmit={onSubmit} className="grid w-full gap-4">
        {status === "valid" ? null : (
          <div className="text-accent-red">
            <span> That username is taken</span>
          </div>
        )}
        <label className="grid-flow-rows grid gap-2 font-bold">
          <span>
            Username{" "}
            <span className="text-sm font-normal">
              (numbers, letters, and underscores only)
            </span>
          </span>
          <input
            type="text"
            pattern="[A-Za-z_0-9]+"
            value={data.username}
            onChange={(e) =>
              setData({ ...data, username: e.currentTarget.value })
            }
          />
        </label>
        <ButtonPrimary
          disabled={
            status === "invalidUsername" ||
            data.username.match(/^[A-Za-z_0-9]+$/) === null
          }
          type="submit"
          content="Construct your studio!"
        />
      </form>
    </div>
  );
}
