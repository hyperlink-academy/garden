import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

export default function ConfirmEmailPage() {
  let router = useRouter();
  let { confirmationURL } = router.query;
  let { session } = useAuth();
  let debounceInteveral = useRef<number | null>(null);
  useEffect(() => {
    if (debounceInteveral.current)
      window.clearTimeout(debounceInteveral.current);
    debounceInteveral.current = window.setTimeout(async () => {
      if (session.loggedIn) {
        if (session.session?.username)
          return router.push(`/s/${session?.session.username}`);
        else return router.push("/setup");
      }
      if (confirmationURL) {
        return window.location.replace(confirmationURL as string);
      }
    }, 500);
  }, [session, confirmationURL, router]);
  return <></>;
}
