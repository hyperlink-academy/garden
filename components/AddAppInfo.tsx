import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { Modal } from "./Layout";
import { useEffect, useState } from "react";
import { AddTiny, MoreOptionsTiny, Settings } from "./Icons";
import { ButtonPrimary, ButtonSecondary } from "./Buttons";

export const AddAppInfo = () => {
  let [open, setOpen] = useState(false);
  return (
    <>
      <ButtonSecondary
        content="Get the Hyperlink App"
        icon={<AddTiny />}
        onClick={() => setOpen(true)}
        type="button"
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2>Add the App!</h2>
        <p>
          Get Hyperlink on your home screen — and get push notifications for
          activity in your Spaces.
        </p>

        <h3>first, grab your phone 📱</h3>
        <ol className="flex list-decimal flex-col gap-1 pl-4 sm:pl-8">
          <li>Open hyperlink.academy in your browser</li>
          <li>
            Tap the Share icon (iOS / Safari) or three dot menu (Android /
            Chrome)
          </li>
          <li>Select &quot;Add to Home Screen&quot;</li>
        </ol>

        <h3>then, turn on notifications 🔔</h3>
        <p className="flex gap-2">
          Open the app, log in,{" "}
          <span className="inline-block justify-center">
            <Settings />
          </span>{" "}
          → <span className="self-center italic">enable notifications</span>
        </p>

        <p>We&apos;ll ping you for new chats & card comments.</p>

        <ButtonPrimary content="Got It!" onClick={() => setOpen(false)} />
      </Modal>
    </>
  );
};
