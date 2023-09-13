import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { Modal } from "./Layout";
import { useEffect, useState } from "react";
import { MoreOptionsTiny, Settings } from "./Icons";
import { ButtonLink, ButtonSecondary } from "./Buttons";
import useSWR from "swr";

export const NotificationManager = () => {
  let supabase = useSupabaseClient<Database>();
  let [open, setOpen] = useState(false);
  let [notificationPermissionState, setNotificationPermissionState] =
    useState("default");
  let [pushPermissionState, setPushPermissionState] = useState("prompt");
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
  }, [existingSubscription]);
  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationPermissionState("unavailable");
    } else {
      let notificationPermissionState = Notification.permission;
      setNotificationPermissionState(notificationPermissionState);
    }

    navigator.serviceWorker
      .getRegistrations()
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
      <Modal open={open} onClose={() => setOpen(false)}>
        <h3>Push Notifications</h3>
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
        {pushPermissionState === "default" ||
        pushPermissionState === "prompt" ||
        (pushPermissionState === "granted" && !existingSubscription) ? (
          <>
            <p>
              Turn on notifications for new chat messages and card comments in
              your Spaces.
            </p>
            <ButtonLink
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
              className="w-fit"
              content="enable notifications"
            ></ButtonLink>
          </>
        ) : pushPermissionState === "granted" ? (
          <div>
            You've enabled notifications on this device!
            <ButtonSecondary
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
        ) : notificationPermissionState === "unavailable" ? (
          "Notifications unavailable in this browser."
        ) : (
          "You've denied notifications on this device."
        )}
      </Modal>
    </>
  );
};
