import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { Modal } from "./Layout";
import { useEffect, useState } from "react";
import { AddTiny, MoreOptionsTiny } from "./Icons";
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
          Add Hyperlink as a web app to get notified when there&apos;s activity
          in a Space!
        </p>
        <p>We&apos;ll ping you for all new chat messages and card comments.</p>

        {/* iOS */}
        <p>To install on iOS:</p>
        <ol className="flex list-decimal flex-col gap-1 pl-4 sm:pl-8">
          <li>Open Hyperlink in Safari</li>
          <li>Tap the share icon</li>
          <li>Select &quot;Add to Home Screen&quot;</li>
        </ol>

        {/* Android */}
        <p>To install on Android:</p>
        <ol className="flex list-decimal flex-col gap-1 pl-4 sm:pl-8">
          <li>Click here [TBD]</li>
        </ol>

        <p>And…done 🎉</p>

        {/* desktop */}
        {/* IGNORE FOR NOW */}

        <p>
          This adds Hyperlink to your home screen — it installs instantly and
          lets you turn on push notifications for activity in your Spaces.
        </p>

        <ButtonPrimary content="Got It!" onClick={() => setOpen(false)} />
      </Modal>
    </>
  );
};
