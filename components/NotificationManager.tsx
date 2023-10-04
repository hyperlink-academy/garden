import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { Divider } from "./Layout";
import { useEffect, useState } from "react";
import { Settings } from "./Icons";
import { ButtonPrimary, ButtonSecondary } from "./Buttons";
import { useAuth } from "hooks/useAuth";
import { Modal } from "./Modal";

export const NotificationManager = () => {
  let supabase = useSupabaseClient<Database>();
  let { logout } = useAuth();
  let [open, setOpen] = useState(false);
  let [notificationPermissionState, setNotificationPermissionState] =
    useState("default");
  let [pushPermissionState, setPushPermissionState] = useState("unavailable");
  let [existingSubscription, setExistingSubscription] =
    useState<PushSubscription | null>(null);
  useEffect(() => {
    (async () => {
      if (!existingSubscription) return;

      let { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      await supabase.from("push_subscriptions").insert({
        user_id: session.session.user.id,
        endpoint: existingSubscription.endpoint,
        push_subscription: existingSubscription as any,
      });
    })();
  }, [existingSubscription, supabase]);
  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationPermissionState("unavailable");
    } else {
      let notificationPermissionState = Notification.permission;
      console.log(notificationPermissionState);
      setNotificationPermissionState(notificationPermissionState);
    }

    navigator.serviceWorker
      ?.getRegistrations()
      .then(async function (registrations) {
        for (let registration of registrations) {
          let subscription = await registration.pushManager.getSubscription();
          setExistingSubscription(subscription);
          let current_pushPermissionState =
            await registration.pushManager.permissionState({
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              userVisibleOnly: true,
            });
          setPushPermissionState(current_pushPermissionState);
        }
      });
  }, [supabase]);
  return (
    <>
      <button className="hover:text-accent-blue" onClick={() => setOpen(true)}>
        <Settings />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        header="Personal Settings"
      >
        {/* TODO: per-device logic! */}
        {/* 
        if on desktop:
        prompt mobile install
        can also allow enabling browser notifs
        
        if on mobile + app installed:
        prompt enabling notifications

        if on mobile + app NOT installed: 
        "add the app" button, triggers modal / install flow
        */}

        {/* TODO: multiple devices?  */}
        {/*
        global toggle - ???
        (grey out below list, if any)

        if enabled on any devices:
        show list of devices w/ toggle for each

        if not yet enabled for this device:
        BUTTON: enable for this device

        if denied…???
        */}
        <NotificationModalContent
          pushPermissionState={pushPermissionState}
          notificationPermissionState={notificationPermissionState}
          existingSubscription={existingSubscription}
          setExistingSubscription={setExistingSubscription}
          setNotificationPermissionState={setNotificationPermissionState}
        />

        <hr className="border-grey-55" />
        <div className="lightBorder px-2 py-3">
          <ButtonSecondary
            className="mx-auto"
            content="Log out"
            onClick={() => logout()}
          />
        </div>
      </Modal>
    </>
  );
};

const NotificationModalContent = ({
  notificationPermissionState,
  pushPermissionState,
  existingSubscription,
  setExistingSubscription,
  setNotificationPermissionState,
}: {
  notificationPermissionState: string;
  pushPermissionState: string;
  existingSubscription: PushSubscription | null;
  setExistingSubscription: React.Dispatch<
    React.SetStateAction<PushSubscription | null>
  >;
  setNotificationPermissionState: React.Dispatch<React.SetStateAction<string>>;
}) => {
  let supabase = useSupabaseClient<Database>();
  let isIos =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)); // iPad iOS 13

  if (
    notificationPermissionState === "unavailable" ||
    pushPermissionState === "unavailable"
  )
    // This what you see in the mobile browser and in certain other desktop browsers like Arc
    return (
      <div className="flex flex-col gap-3 text-grey-35">
        <div className="lightBorder  flex flex-col gap-1 px-3 py-3">
          <p className="pb-3 text-center font-bold">
            Get the Web App to enable <br /> push notifications!
          </p>
          {/* <p className="text-sm">
            We only notify you about new chat messages and comments in your
            Spaces.
          </p> */}
          {/* if iOs */}
          {isIos ? (
            <>
              <p>From your mobile browser...</p>
              <ol className="flex list-outside list-decimal flex-col gap-2 pl-8">
                <li>
                  <div className="pb-2">
                    <span className="font-bold">Safari</span>
                    <br /> Select the &quot;Share&quot; icon at the bottom of
                    the browser window.
                  </div>
                  <div>
                    <span className="font-bold">NOT Safari</span> <br />
                    Open the browser menu in the bottom right of the window and
                    select &quot;Share&quot;.
                  </div>
                </li>
                <Divider />
                <li>Select &quot;Add to Home Screen&quot;.</li>
                <Divider />
                <li>
                  Follow the prompts to download the app to your home screen.
                </li>
                <Divider />
                <li>
                  <p className="font-bold">
                    Using your new Web App open up this settings page and enable
                    notifications!
                  </p>
                </li>
              </ol>
            </>
          ) : (
            <>
              <p className="pb-2">From your mobile browser...</p>
              <ol className="flex list-outside list-decimal flex-col gap-4 pl-8">
                <li>
                  Open the browser menu in the top right of the browser window
                </li>
                <Divider />
                <li>Select &quot;Add to Home Screen&quot;.</li>
                <Divider />
                <li>
                  Follow the prompts to download the app to your home screen.
                </li>
                <Divider />
                <li>
                  <p className="font-bold">
                    Using your new Web App open up this settings page and enable
                    notifications!
                  </p>
                </li>
              </ol>
            </>
          )}
        </div>
      </div>
    );

  if (
    pushPermissionState === "default" ||
    pushPermissionState === "prompt" ||
    (pushPermissionState === "granted" && !existingSubscription)
  )
    // this is what you see if you're on most desktop browsers and you haven't enabled anything
    return (
      <>
        <div className="lightBorder flex flex-col  justify-center gap-3 bg-grey-90 px-2 py-3 text-center text-grey-35">
          <div className="flex flex-col gap-1">
            <div className="font-bold">
              Push Notifications are disabled on this device
            </div>
            <p className="text-sm">
              We only notify you about new chat messages and comments in your
              Spaces.
            </p>
          </div>
          <ButtonPrimary
            onClick={() => {
              navigator.serviceWorker
                .getRegistrations()
                .then(async function (registrations) {
                  for (let registration of registrations) {
                    let result = await registration.pushManager.subscribe({
                      applicationServerKey:
                        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                      userVisibleOnly: true,
                    });
                    let { data: session } = await supabase.auth.getSession();
                    if (!session.session) return;
                    await supabase.from("push_subscriptions").insert({
                      user_id: session.session.user.id,
                      endpoint: result.endpoint,
                      push_subscription: result as any,
                    });

                    setExistingSubscription(result);
                    setNotificationPermissionState("granted");
                    return;
                  }
                });
            }}
            className="mx-auto w-fit"
            content="Enable Notifications!"
          ></ButtonPrimary>
        </div>
        {window.matchMedia("(min-width: 640px)").matches ? (
          <div className="lightBorder flex flex-col gap-1 px-2 py-3 text-center">
            <p className="font-bold">
              Get mobile notifications with our Web App!
            </p>
            <p> Navigate back here from a mobile browser to download it.</p>
          </div>
        ) : null}
      </>
    );

  // this is what you see if you enabled notifcations on both desktop and mobile
  if (pushPermissionState === "granted" && existingSubscription)
    return (
      <>
        <div className="lightBorder flex flex-col  justify-center gap-3 bg-bg-blue px-2 py-3 text-center text-grey-35">
          <div className="flex flex-col gap-1">
            <p className="font-bold">
              You&apos;ve enabled notifications on this device!
            </p>
            <p className="text-sm">
              We only notify you about new chat messages and comments in your
              Spaces.
            </p>
          </div>
          <ButtonSecondary
            className="mx-auto"
            content={"Disable Notifications"}
            onClick={async () => {
              navigator.serviceWorker
                .getRegistrations()
                .then(async function (registrations) {
                  for (let registration of registrations) {
                    let push_subscription =
                      await registration.pushManager.getSubscription();
                    if (!push_subscription) return;
                    let { data: session } = await supabase.auth.getSession();
                    if (!session.session) return;
                    await supabase
                      .from("push_subscriptions")
                      .delete()
                      .eq("endpoint", push_subscription.endpoint);
                    await push_subscription.unsubscribe();
                    setExistingSubscription(null);
                  }
                });
            }}
          />
        </div>

        {window.matchMedia("(min-width: 640px)").matches ? null : (
          <div className="lightBorder flex flex-col gap-1 px-2 py-3 text-center">
            <p className="font-bold">
              Get mobile notifications with our Web App!
            </p>
            <p> Navigate back here from a mobile browser to download it.</p>
          </div>
        )}
      </>
    );

  return (
    <>
      <div className="lightBorder grey-55 px-2 py-3 text-center italic">
        Notifications are unavailable on this device D:
      </div>
    </>
  );
};

const MobileDownloadPrompt = () => {};
