import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { Modal } from "./Layout";
import { useEffect, useState } from "react";
import { MoreOptionsTiny, Settings } from "./Icons";

export const NotificationManager = () => {
  let supabase = useSupabaseClient<Database>();
  let [open, setOpen] = useState(false);
  let [result, setResult] = useState({});
  let [notificationPermissionState, setNotificationPermissionState] =
    useState("default");
  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationPermissionState("unavailable");
    } else {
      let notificationPermissionState = Notification.permission;
      setNotificationPermissionState(notificationPermissionState);
    }
  }, []);
  return (
    <>
      <button className="hover:text-accent-blue" onClick={() => setOpen(true)}>
        <Settings />
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        {notificationPermissionState === "default" ? (
          <button
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
                    setResult(result);
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
          >
            subscribe
          </button>
        ) : notificationPermissionState === "granted" ? (
          "You've subscribed!"
        ) : notificationPermissionState === "unavailable" ? (
          "Notifications unavailable in this browser"
        ) : (
          "You've denied notifications."
        )}
      </Modal>
    </>
  );
};
