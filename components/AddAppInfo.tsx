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
          This adds Hyperlink to your home screen, and lets you turn on push
          notifications for activity in your Spaces.
        </p>

        <h3>first, add the app</h3>

        {/* iOS */}
        <p>To install on iOS:</p>
        <ol className="flex list-decimal flex-col gap-1 pl-4 sm:pl-8">
          <li>Open Hyperlink in Safari</li>
          <li>Tap the Share menu icon</li>
          <li>Select &quot;Add to Home Screen&quot;</li>
        </ol>

        {/* Android */}
        <p>To install on Android:</p>
        <ol className="flex list-decimal flex-col gap-1 pl-4 sm:pl-8">
          <li>Open in Chrome</li>
          <li>Tap the &quot;three dot&quot; menu icon</li>
          <li>Select &quot;Add to Home Screen&quot;</li>
        </ol>

        {/* desktop */}
        {/* IGNORE FOR NOW */}

        <h3>then, turn on notifications</h3>

        <p className="flex gap-2">
          Open the app, log in,{" "}
          <span className="inline-block justify-center">
            <Settings />
          </span>{" "}
          →{" "}
          <span className="self-center text-sm italic">
            enable notifications
          </span>
        </p>

        <p>We&apos;ll ping you for all new chat messages and card comments.</p>

        {/* <p>And…done 🎉</p> */}

        <ButtonPrimary content="Got It!" onClick={() => setOpen(false)} />
      </Modal>
    </>
  );
};
