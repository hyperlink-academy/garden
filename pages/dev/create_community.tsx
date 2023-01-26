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
  let { session } = useAuth();
  if (!session.loggedIn) return <Link href="/login">login</Link>;
  return (
    <div className="max-w-3xl py-16 mx-auto p-4 flex flex-col gap-3">
      <h1>Create a community</h1>
      <form
        className="flex gap-2 w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!session?.token) return;
          let res = await workerAPI(WORKER_URL, "create_community", {
            token: session.token,
            communityName,
          });
          console.log(res);
          if (!res.success) setStatus({ status: "error" });
          else setStatus({ status: "success" });
        }}
      >
        <input
          className="border-2 bg-white p-2 w-full"
          placeholder="community name"
          value={communityName}
          onChange={(e) => setCommunityName(e.currentTarget.value)}
        />
        <ButtonPrimary type="submit" content="Create!" />
      </form>
    </div>
  );
}
