import { useEffect } from "react";
import Router from "next/router";
import { useAuth } from "hooks/useAuth";

export default function PWAHomepage() {
  let { session } = useAuth();
  useEffect(() => {
    if (session.session?.username)
      Router.push("/s/" + session.session.username);
    else Router.push("/");
  }, [session]);
  return null;
}
