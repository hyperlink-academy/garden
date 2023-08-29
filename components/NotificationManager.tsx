import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { Modal } from "./Layout";
import { useEffect, useState } from "react";
import { MoreOptionsTiny, Settings } from "./Icons";
import { ButtonLink } from "./Buttons";

export const NotificationManager = () => {
  let supabase = useSupabaseClient<Database>();
  let [open, setOpen] = useState(false);
  let [notificationPermissionState, setNotificationPermissionState] =
    useState("default");
  let [pushPermissionState, setPushPermissionState] = useState("prompt");
  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationPermissionState("unavailable");
    } else {
      let notificationPermissionState = Notification.permission;
      setNotificationPermissionState(notificationPermissionState);
    }

    navigator.serviceWorker
      .getRegistrations()
      .then(async function(registrations) {
        for (let registration of registrations) {
          let current_pushPermissionState =
            await registration.pushManager.permissionState({
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              userVisibleOnly: true,
            });
          setPushPermissionState(current_pushPermissionState);
          if (current_pushPermissionState === "granted") {
            let { data: session } = await supabase.auth.getSession();
            if (!session.session) return;
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) return;

            let { data: existingSubscription } = await supabase
              .from("push_subscriptions")
              .select("*")
              .eq("endpoint", subscription.endpoint);

            if (!existingSubscription)
              await supabase.from("push_subscriptions").insert({
                user_id: session.session.user.id,
                endpoint: subscription.endpoint,
                push_subscription: subscription as any,
              });
          }
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
        pushPermissionState === "prompt" ? (
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
                    }
                  });
                setNotificationPermissionState("granted");
              }}
              className="w-fit"
              content="enable notifications"
            ></ButtonLink>
          </>
        ) : pushPermissionState === "granted" ? (
          "You've enabled notifications on this device!"
        ) : notificationPermissionState === "unavailable" ? (
          "Notifications unavailable in this browser."
        ) : (
          "You've denied notifications on this device."
        )}
      </Modal>
    </>
  );
};
