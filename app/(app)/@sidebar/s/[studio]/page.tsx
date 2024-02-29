// SIDEBAR FOR USER HOME

"use client";

import Link from "next/link";
import { useAuth } from "hooks/useAuth";

export default function UserPageSidebar(props: { params: { studio: string } }) {
  let { session } = useAuth();
  return (
    <>
      <div className="flex flex-row">
        <Link href={session.session ? `/s/${session.session.username}` : "/"}>
          h/
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <Tab name="Spaces" />
        <Tab name="Studios" />
        {session?.session?.username === props.params.studio && (
          <Tab name="Settings" />
        )}
      </div>
    </>
  );
}

const Tab = (props: { name: string }) => {
  return <div>{props.name}</div>;
};
