import { workerAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useState } from "react";
import { ButtonLink, ButtonSecondary } from "./Buttons";
import { Send } from "./Icons";
import { Modal } from "./Layout";
import AutosizeTextarea from "./Textarea/AutosizeTextarea";

export const Feedback = () => {
  const [input, setInput] = useState("");
  let [open, setOpen] = useState(false);
  let { session } = useAuth();
  let [state, setState] = useState<"normal" | "loading" | "sent">("normal");
  return (
    <>
      <ButtonLink content="feedback" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)}>
        {state === "sent" ? (
          <div>
            Thanks for taking the time to help us make this a better place to
            learn!{" "}
            <button
              className="inline text-accent-blue"
              onClick={() => setState("normal")}
            >
              more feedback?{" "}
            </button>{" "}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <h3>We&apos;d love to hear your feedback</h3>
              <p className="text-sm italic text-grey-55">
                {!session.loggedIn
                  ? "Thanks for your thoughts! If you'd like us to get back to you, please include your email!"
                  : "We'll get back to you via email, thanks for your thoughts!"}
              </p>
            </div>
            <AutosizeTextarea
              placeholder="Your feedback..."
              className="min-h-[128px] rounded-md border border-grey-55 p-2"
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
            />
            <ButtonSecondary
              onClick={async () => {
                setState("loading");
                let res = await workerAPI(WORKER_URL, "feedback", {
                  email: session.user?.email,
                  page: window.location.href,
                  content: input,
                });
                setInput("");
                setState("sent");
              }}
              content="send"
              className="place-self-end"
              icon={<Send />}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
