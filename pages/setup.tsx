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
        <h1>An error occured</h1>
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
    <Modal open={true} onClose={() => {}}>
      <div className="flex max-w-md flex-col gap-2">
        <img
          className="place-self-end"
          width={"264px"}
          alt="a house in an overgrown field"
          src="/img/spotIllustration/welcome.png"
        />
        <div className="grid-auto-rows grid gap-2">
          <h2>Hi! It&apos;s nice to meet you!</h2>
        </div>

        <form onSubmit={onSubmit} className="grid w-full gap-4 text-grey-35">
          {/* pick a name */}
          <div className="flex flex-col gap-4">
            <label className="grid-flow-rows grid gap-2 font-bold">
              <div className="flex flex-col gap-0">
                Pick a Username
                <p className="text-sm font-normal text-grey-55">
                  Unique, no special characters or spaces!
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  minLength={3}
                  required
                  pattern="[A-Za-z_0-9]+"
                  title="No special characters or spaces please!"
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
        <Divider />
        {/* get started */}
        <div className="lightBorder flex flex-col gap-4 bg-bg-blue p-3 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-bold italic">psst, you should get the app!</p>
            <div className="flex flex-col gap-1 text-sm text-grey-55">
              <p>
                Hyperlink is a great place for collaboration. Get the app for
                updates when someone comments, or messages you.
              </p>

              <p>
                Log in on a mobile browser, and open your settings to find out
                how.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
