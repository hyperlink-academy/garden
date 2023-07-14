import { useEffect } from "react";
import Router from "next/router";
import { useAuth } from "hooks/useAuth";

export default function PWAHomepage() {
  let { session } = useAuth();
  useEffect(() => {
    let timeout = setTimeout(() => {
      console.log(session);
      if (session.session?.username)
        Router.push("/s/" + session.session.username);
      else Router.push("/");
    }, 500);
    return () => clearTimeout(timeout);
  }, [session]);
  return null;
}
