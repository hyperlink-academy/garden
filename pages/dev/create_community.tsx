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
  const [communityName, setCommunityName] = useState("");
  const [status, setStatus] = useState<
    { status: "normal" } | { status: "error" } | { status: "success" }
  >({ status: "normal" });
  let { session, authToken } = useAuth();
  if (!session.loggedIn) return <Link href="/login">login</Link>;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4 py-16">
      <h1>Create a community</h1>
      <form
        className="flex w-full gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!authToken) return;
          let res = await workerAPI(WORKER_URL, "create_community", {
            authToken,
            communityName,
          });
          console.log(res);
          if (!res.success) setStatus({ status: "error" });
          else setStatus({ status: "success" });
        }}
      >
        <input
          className="w-full border-2 bg-white p-2"
          placeholder="community name"
          value={communityName}
          onChange={(e) => setCommunityName(e.currentTarget.value)}
        />
        <ButtonPrimary type="submit" content="Create!" />
      </form>
    </div>
  );
}
