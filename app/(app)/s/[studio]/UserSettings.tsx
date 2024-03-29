import { useEffect, useState } from "react";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { HelpAppInfo } from "components/HelpCenter";
import { supabaseBrowserClient } from "supabase/clients";
import { Divider } from "components/Layout";

export const UserSettings = () => {
  let supabase = supabaseBrowserClient();
  let { logout } = useAuth();
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
    <div className="flex max-w-2xl flex-col gap-4">
      <NotificationModalContent
        pushPermissionState={pushPermissionState}
        notificationPermissionState={notificationPermissionState}
        existingSubscription={existingSubscription}
        setExistingSubscription={setExistingSubscription}
        setPushPermissionState={setPushPermissionState}
        setNotificationPermissionState={setNotificationPermissionState}
      />
      <Divider />
      <ButtonSecondary
        className="mx-auto"
        content="Log out"
        onClick={() => logout()}
      />
      {/* </div> */}
    </div>
  );
};

const NotificationModalContent = ({
  notificationPermissionState,
  pushPermissionState,
  existingSubscription,
  setExistingSubscription,
  setNotificationPermissionState,
  setPushPermissionState,
}: {
  notificationPermissionState: string;
  pushPermissionState: string;
  existingSubscription: PushSubscription | null;
  setExistingSubscription: React.Dispatch<
    React.SetStateAction<PushSubscription | null>
  >;
  setPushPermissionState: React.Dispatch<React.SetStateAction<string>>;
  setNotificationPermissionState: React.Dispatch<React.SetStateAction<string>>;
}) => {
  let supabase = supabaseBrowserClient();

  if (
    notificationPermissionState === "unavailable" ||
    pushPermissionState === "unavailable"
  )
    // This what you see in the mobile browser and in certain other desktop browsers like Arc
    return (
      <div className="text-grey-35 flex flex-col gap-3">
        <div className="lightBorder flex flex-col gap-4 p-4">
          <h3 className="bg-accent-gold m-auto w-fit -rotate-2 -skew-x-6 rounded-md px-4 py-2 text-center">
            Get the Hyperlink app!
          </h3>
          <HelpAppInfo />
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
        <div className="lightBorder bg-grey-90 text-grey-35  flex flex-col justify-center gap-3 px-2 py-3 text-center">
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
                    setExistingSubscription(result);
                    setNotificationPermissionState("granted");
                    setPushPermissionState("granted");
                    let { data: session } = await supabase.auth.getSession();
                    if (!session.session) return;
                    await supabase.from("push_subscriptions").insert({
                      user_id: session.session.user.id,
                      endpoint: result.endpoint,
                      push_subscription: result as any,
                    });

                    return;
                  }
                });
            }}
            className="mx-auto w-fit"
            content="Enable Notifications!"
          ></ButtonPrimary>
        </div>
        <MobilePrompt />
      </>
    );

  // this is what you see if you enabled notifications on both desktop and mobile
  if (pushPermissionState === "granted" && existingSubscription)
    return (
      <>
        <div className="lightBorder bg-bg-blue text-grey-35  flex flex-col justify-center gap-3 px-2 py-3 text-center">
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

        <MobilePrompt />
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

const MobilePrompt = () => {
  if (window.matchMedia("(min-width: 640px)").matches)
    return (
      <div className="lightBorder flex flex-col gap-1 px-2 py-3 text-center">
        <p className="font-bold">
          Get notifications on your phone with our web app!
        </p>
        <p> Navigate back here from a mobile browser to install it ✨</p>
      </div>
    );
  return null;
};
