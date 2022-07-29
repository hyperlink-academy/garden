import { workerAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { Textarea } from "components/Textarea";
import { AuthProvider, useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useState } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function GenerateSignupCodesPage() {
  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  );
}
function Page() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    | { status: "normal" }
    | { status: "error" }
    | { status: "success"; code: string }
  >({ status: "normal" });
  let { session } = useAuth();
  if (!session.loggedIn)
    return (
      <Link href="/login">
        <a>login</a>
      </Link>
    );
  return (
    <div className="max-w-3xl py-16 mx-auto p-4 flex flex-col gap-3">
      <h1>Generate a signup code</h1>
      <form
        className="flex gap-2 w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!session?.token) return;
          let res = await workerAPI(WORKER_URL, "create_signup_code", {
            token: session.token,
            message,
          });
          if (!res.success) setStatus({ status: "error" });
          else setStatus({ status: "success", code: res.code });
        }}
      >
        <Textarea
          className="border-2 bg-white p-2 w-full"
          placeholder="a welcome message"
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
        />
        <ButtonPrimary type="submit" content="Create!" />
      </form>

      {(() => {
        switch (status.status) {
          case "normal":
            return null;
          case "error":
            return "an error occured";
          case "success":
            return (
              <a>{`https://hyperlink.academy/signup?signupCode=${status.code}`}</a>
            );
        }
      })()}
    </div>
  );
}
