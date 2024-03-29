"use client";
import { workerAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";
import { useAuth } from "hooks/useAuth";
import { useDebouncedEffect } from "hooks/utils";
import { useSearchParams } from "next/dist/client/components/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WORKER_URL } from "src/constants";
import { supabaseBrowserClient } from "supabase/clients";
import Image from "next/image";
import spotIllo from "public/img/spotIllustration/welcome.png";

export function SignupPageForm() {
  let router = useRouter();
  let supabase = supabaseBrowserClient();
  let [status, setStatus] = useState<
    "valid" | "invalidUsername" | "complete" | "loading"
  >("valid");
  let [data, setData] = useState({
    username: "",
    where_did_you_find_us: "",
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
  let query = useSearchParams();
  let redirectTo = query?.get("redirectTo");
  let error_description = query?.get("error_description");
  let { authToken: tokens } = useAuth();
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens) return;
    setStatus("loading");
    let res = await workerAPI(WORKER_URL, "signup", {
      username: data.username,
      where_did_you_find_us: data.where_did_you_find_us,
      tokens,
    });
    if (!res.success) {
      if (res.error === "username already exists") setStatus("invalidUsername");
      if (res.error === "user already initialized") {
        if (redirectTo) router.push(redirectTo);
        else router.push(`/s/${data.username}`);
      }
    }
    if (res.success) {
      let { data } = await supabase.auth.refreshSession();
      if (data.session) {
        await supabase.auth.setSession(data?.session);
        if (redirectTo) router.push(redirectTo);
        else router.push(`/s/${data.user?.user_metadata.username}`);
      }
      setStatus("complete");
    }
  };
  if (error_description)
    return (
      <div className="lightBorder flex flex-col gap-2 bg-white p-2">
        <h3>Sorry, an error occurred</h3>
        <div>{error_description}</div>
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

  return (
    <div className=" -my-4 mx-auto flex h-screen max-w-md flex-col items-center justify-center gap-4 px-3 ">
      <div className="lightBorder mt-3 flex w-full max-w-md flex-col gap-4 bg-white p-3 sm:p-4">
        <Image
          src={spotIllo}
          className="place-self-end"
          width={264}
          alt="a house in an overgrown field"
        />
        <h3>Hi, welcome to Hyperlink!</h3>

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

            {/* where did you find us? */}
            <label className="grid-flow-rows grid gap-2 font-bold">
              <div className="flex flex-col gap-1">
                Where&apos;d you find us?
                <p className="text-sm font-normal text-grey-55">
                  optional, but super helpful!
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <input
                  className="font-normal"
                  type="text"
                  title="Where did you find us?"
                  value={data.where_did_you_find_us}
                  onChange={(e) =>
                    setData({
                      ...data,
                      where_did_you_find_us: e.currentTarget.value,
                    })
                  }
                />
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
      </div>
      <div className="lightBorder mb-3 flex w-full flex-col gap-2 bg-bg-blue p-3 text-sm text-grey-55 sm:p-4">
        {/* <p className="font-bold italic">psst, you should get the app!</p> */}
        <h4 className="text-grey-35">Get the Hyperlink app!</h4>

        <div className="flex flex-col gap-2 text-sm ">
          <p>
            Hyperlink is made for collaboration. Get the app for notifications
            from others in shared Spaces.
          </p>

          <p>
            Log in on a mobile browser and open your settings to find out how ✨
          </p>
        </div>
      </div>
    </div>
  );
}
