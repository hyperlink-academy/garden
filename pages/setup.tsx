import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { workerAPI } from "backend/lib/api";
import { AddAppInfo } from "components/AddAppInfo";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { AddSmall, AddTiny, Settings } from "components/Icons";
import { useAuth } from "hooks/useAuth";
import { useDebouncedEffect } from "hooks/utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function SignupPage() {
  let router = useRouter();
  let supabase = useSupabaseClient();
  let [status, setStatus] = useState<
    "valid" | "invalidUsername" | "complete" | "loading"
  >("valid");
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
      setStatus((previousStatus) => {
        if (previousStatus !== "valid" && previousStatus !== "invalidUsername")
          return previousStatus;
        if (existingUsername) return "invalidUsername";
        return "valid";
      });
    },
    300,
    [data.username]
  );

  let { authToken: tokens, session } = useAuth();
  useEffect(() => {
    if (session?.session?.username) {
      if (router.query.redirectTo)
        router.push(
          router.query.redirectTo as string,
          router.query.redirectTo as string
        );
      else router.push(`/s/${session?.session?.username}`);
    }
  }, [session, router]);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens) return;
    setStatus("loading");
    let res = await workerAPI(WORKER_URL, "signup", {
      username: data.username,
      tokens,
    });
    console.log(res, router.query.redirectTo);
    if (!res.success) {
      if (res.error === "username already exists") setStatus("invalidUsername");
      if (res.error === "user already initialized") {
        if (router.query.redirectTo)
          router.push(
            router.query.redirectTo as string,
            router.query.redirectTo as string
          );
        else router.push(`/s/${data.username}`);
      }
    }
    if (res.success) {
      let { data } = await supabase.auth.refreshSession();
      if (data.session) {
        await supabase.auth.setSession(data?.session);
        if (router.query.redirectTo)
          router.push(
            router.query.redirectTo as string,
            router.query.redirectTo as string
          );
        else router.push(`/s/${data.user?.user_metadata.username}`);
      }
      setStatus("complete");
    }
  };

  if (!tokens)
    return (
      <div className="grid-rows-max mx-auto grid max-w-md gap-4">
        <h1>Set up your Homepage!</h1>
        <p>
          To continue,{" "}
          <Link className="text-accent-blue" href="/signup">
            sign up
          </Link>{" "}
          or{" "}
          <Link className="text-accent-blue" href="/login">
            log in
          </Link>
        </p>
      </div>
    );

  return (
    <div className="grid-rows-max mx-auto grid max-w-md gap-8">
      <div className="grid-auto-rows grid gap-2">
        <h1>Set up your Homepage!</h1>
      </div>

      <form onSubmit={onSubmit} className="grid w-full gap-8">
        {/* add the app */}
        {/* TODO: device logic!
        if on computer…would just prompt to get phone out
        if on phone…still on setup + skip if already in app? 
        maybe trigger notif permissions RIGHT HERE??
        */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue p-2 text-white">
              1
            </div>
            <h2>add the app</h2>
          </div>
          <p>For easy access & notifications from collaborators 📬</p>
          <p className="italic">
            You can do this now & continue setup on mobile!
          </p>
          <AddAppInfo />
        </div>

        {/* pick a name */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue p-2 text-white">
              2
            </div>
            <h2>pick a name</h2>
          </div>
          <p>
            How others see you — and the name of your Hyperlink Homepage, where
            all your Spaces live 🏡
          </p>
          <label className="grid-flow-rows grid gap-2 font-bold">
            <span>
              Username{" "}
              <span className="text-sm font-normal">
                (numbers, letters, and underscores only)
              </span>
            </span>
            {status === "invalidUsername" ? (
              <p className="pb-1 font-bold text-accent-red">
                Sorry, that username is not available!
              </p>
            ) : null}
            <input
              type="text"
              minLength={3}
              required
              pattern="[A-Za-z_0-9]+"
              value={data.username}
              onChange={(e) =>
                setData({ ...data, username: e.currentTarget.value })
              }
            />
          </label>
        </div>

        {/* get started */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue p-2 text-white">
              3
            </div>
            <h2>get started</h2>
          </div>
          <p>
            Make your first Space — you&apos;ll find some inspiration on your
            Homepage ✨
          </p>
          <ButtonPrimary
            disabled={
              status === "invalidUsername" ||
              data.username.match(/^[A-Za-z_0-9]+$/) === null
            }
            type="submit"
            content={
              status === "loading" ? <DotLoader /> : "Create your Homepage!"
            }
          />
        </div>
      </form>
    </div>
  );
}
