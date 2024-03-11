// SIDEBAR FOR USER HOME

"use client";

import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { Divider } from "components/Layout";
import { HomeTabs } from "./HomeTabs";
import { LoginButton } from "components/LoginModal";

export default function UserPageSidebar(props: { params: { studio: string } }) {
  let { session } = useAuth();
  return (
    <>
      <div className="sidebarHome flex h-full flex-col items-stretch gap-0">
        <div className="sidebarHomeBreadcrumb flex items-center justify-between px-3">
          <Link
            className="sidebarBreadcrumb text-grey-55 flex shrink-0 flex-row items-center text-sm"
            href={session.session ? `/s/${session.session.username}` : "/"}
          >
            <div className="flex gap-1">
              <div className="font-bold">h</div>
              <div className="font-bold">/</div>
              {session.loggedIn && (
                <>
                  <div>home</div>
                  <div> / </div>
                </>
              )}
            </div>
          </Link>
        </div>

        <div className="sidebarSpaceName shrink-0 flex-row px-3 text-lg font-bold">
          {props.params.studio}
        </div>
        <div className="px-3 pt-2">
          {!session.session && <LoginButton small />}{" "}
        </div>

        <div className="py-3">
          <Divider />
        </div>
        <div className="px-3 pb-3">
          <input
            placeholder="search home (ctrl/⌘ K)"
            className="false w-full px-2 py-1 text-sm outline-none"
          />
        </div>
        <HomeTabs username={props.params.studio} />
      </div>
    </>
  );
}
