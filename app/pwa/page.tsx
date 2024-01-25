"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "hooks/useAuth";

export default function PWAHomepage() {
  let { session } = useAuth();
  let router = useRouter();
  useEffect(() => {
    if (session.session?.username)
      router.push("/s/" + session.session.username);
    else router.push("/");
  }, [session]);
  return null;
}
