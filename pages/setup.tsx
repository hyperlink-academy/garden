import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { workerAPI } from "backend/lib/api";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { HelpAppInfo } from "components/HelpCenter";
import { AddTiny } from "components/Icons";
import { useAuth } from "hooks/useAuth";
import { useDebouncedEffect } from "hooks/utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Modal } from "components/Modal";
import { Divider } from "components/Layout";
import LoginPage from "pages/login";

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
  let [open, setOpen] = useState(false);
  let { data: session } = useSWR("session", async () => {
    let { data } = await supabase.auth.refreshSession();
    return data;
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

  let { authToken: tokens } = useAuth();
  useEffect(() => {
    let username = session?.user?.user_metadata.username;
    if (username) {
      if (router.query.redirectTo)
        router.push(
          router.query.redirectTo as string,
          router.query.redirectTo as string
        );
      else router.push(`/s/${username}`);
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
  if (router.query.error_description)
    return (
      <div className="lightBorder flex flex-col gap-2 bg-white p-2">
        <h1>Sorry, an error occurred</h1>
        <div>{router.query.error_description}</div>
        <div>
          Please try to{" "}
          <Link className="text-accent-blue" href="/signup">
            sign up
          </Link>{" "}
          or{" "}
          <Link className="text-accent-blue" href="/login">
            log in
          </Link>{" "}
          again
        </div>
      </div>
    );

  if (!tokens) return <LoginPage />;

  return (
    <div className=" -my-4 mx-auto flex h-screen  max-w-md flex-col items-center justify-center gap-4 ">
      <div className="lightBorder flex max-w-md flex-col gap-4 bg-white p-4">
        <img
          className="place-self-end"
          width={"264px"}
          alt="a house in an overgrown field"
          src="/img/spotIllustration/welcome.png"
        />
        <div className="grid-auto-rows m-auto grid gap-2">
          <h2>Hi, welcome to Hyperlink!</h2>
        </div>

        <form onSubmit={onSubmit} className="grid w-full gap-4 text-grey-35">
          {/* pick a username */}
          <div className="flex flex-col gap-4">
            <label className="grid-flow-rows grid gap-2 font-bold">
              <div className="flex flex-col gap-1">
                Pick a Username
                <p className="text-sm font-normal text-grey-55">
                  numbers, letters, and underscores only
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <input
                  className="font-normal"
                  type="text"
                  minLength={3}
                  required
                  pattern="[A-Za-z_0-9]+"
                  title="Pick a Username"
                  value={data.username}
                  onChange={(e) =>
                    setData({ ...data, username: e.currentTarget.value })
                  }
                />
                {data.username.match(/^[A-Za-z_0-9]+$/) === null &&
                data.username !== "" ? (
                  <p className="text-sm  font-normal text-accent-red">
                    No special characters or spaces please!
                  </p>
                ) : null}

                {status === "invalidUsername" ? (
                  <p className="text-sm font-normal text-accent-red">
                    Sorry, that username is not available!
                  </p>
                ) : null}
              </div>
            </label>
          </div>

          <ButtonPrimary
            className="place-self-end"
            disabled={
              status === "invalidUsername" ||
              data.username.match(/^[A-Za-z_0-9]+$/) === null
            }
            type="submit"
            content={status === "loading" ? <DotLoader /> : "Get Started!"}
          />
        </form>
        {/* <Divider /> */}
        {/* get started */}
        <div className="lightBorder flex flex-col gap-4 bg-bg-blue p-4 text-sm">
          <div className="flex flex-col gap-4">
            {/* <p className="font-bold italic">psst, you should get the app!</p> */}
            <h3 className="m-auto w-fit -rotate-2 -skew-x-6 rounded-md bg-accent-gold px-4 py-2 text-center">
              Get the Hyperlink app!
            </h3>

            <div className="flex flex-col gap-2 text-sm text-grey-55">
              <p>
                Hyperlink is made for collaboration. Get the app for
                notifications from others in shared Spaces.
              </p>

              <p>
                Log in on a mobile browser and open your settings to find out
                how ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
