import { workerAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { useState } from "react";
import { ButtonLink, ButtonSecondary } from "./Buttons";
import { Send } from "./Icons";
import AutosizeTextarea from "./Textarea/AutosizeTextarea";
import { Modal } from "./Modal";
import { Form, SubmitButton } from "./Form";

export const Feedback = () => {
  const [input, setInput] = useState("");
  let [open, setOpen] = useState(false);
  let { session } = useAuth();
  let [state, setState] = useState<"normal" | "loading" | "sent">("normal");
  return (
    <>
      <ButtonLink content="feedback" onClick={() => setOpen(true)} />
      <Modal
        header="We'd Love Your Feedback!"
        open={open}
        onClose={() => setOpen(false)}
      >
        {state === "sent" ? (
          <Form
            validate={() => {}}
            onSubmit={async () => {
              setState("normal");
            }}
          >
            Thanks for taking the time to help us make this a better place to
            learn!
            <SubmitButton
              content="Send Another"
              closeContent="close"
              onClose={() => {
                setOpen(false);
              }}
            />
          </Form>
        ) : (
          <Form
            className="flex flex-col gap-4"
            validate={() => {}}
            onSubmit={async () => {
              setState("loading");
              let res = await workerAPI(WORKER_URL, "feedback", {
                email: session.user?.email,
                page: window.location.href,
                content: input,
              });
              setInput("");
              setState("sent");
            }}
          >
            <div>
              <p className="text-sm italic text-grey-55">
                {!session.loggedIn
                  ? "Thanks for your thoughts! If you'd like us to get back to you, please include your email!"
                  : "We'll get back to you ASAP via email."}
              </p>
            </div>
            <AutosizeTextarea
              placeholder="Your feedback…"
              className="min-h-[128px] rounded-md border border-grey-55 p-2"
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
            />

            <SubmitButton
              content="Send!"
              icon={<Send />}
              onClose={() => {
                setOpen(false);
              }}
            />
            {/* <ButtonSecondary
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
            /> */}
          </Form>
        )}
      </Modal>
    </>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
