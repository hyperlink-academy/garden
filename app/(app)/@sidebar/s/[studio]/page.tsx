// SIDEBAR FOR USER HOME

"use client";

import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { Divider } from "components/Layout";
import { HomeTabs } from "./HomeTabs";
import { LoginButton } from "components/LoginModal";
import SidebarLayout, { useSidebarState } from "../../SidebarLayout";

export default function UserPageSidebar(props: { params: { studio: string } }) {
  let { open } = useSidebarState((state) => state);
  let { session } = useAuth();

  return (
    <SidebarLayout
      breadcrumb={
        <Link
          className="sidebarBreadcrumb flex shrink-0 flex-row items-center text-sm text-grey-55"
          href={session.session ? `/s/${session.session.username}` : "/"}
        >
          <div className="flex gap-1">
            <div className="font-bold hover:text-accent-blue">h</div>
            <div className="font-bold">/</div>
          </div>
        </Link>
      }
    >
      {open ? (
        <UserPageSidebarExpanded {...props} />
      ) : (
        <UserPageSidebarCollapsed {...props} />
      )}
    </SidebarLayout>
  );
}

const UserPageSidebarExpanded = (props: { params: { studio: string } }) => {
  let { session } = useAuth();
  return (
    <>
      <div className="sidebarSpaceName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
        {props.params.studio === session.session?.username
          ? "Home"
          : props.params.studio}
      </div>
      {!session.session && (
        <div className="px-3 pb-1 pt-3">
          <LoginButton small />
        </div>
      )}

      <div className="pb-3 pt-2">
        <Divider />
      </div>
      <div className="px-3 pb-3">
        <input
          placeholder="search home (ctrl/⌘ K)"
          className="false w-full px-2 py-1 text-sm outline-none"
        />
      </div>
      <HomeTabs
        username={props.params.studio}
        className="flex flex-col gap-0.5 px-3"
        collapsed={false}
      />
    </>
  );
};

const UserPageSidebarCollapsed = (props: { params: { studio: string } }) => {
  let { session } = useAuth();
  return (
    <>
      <div
        className="sidebarSpaceName mx-auto h-fit w-fit shrink-0 rotate-180 flex-row font-bold "
        style={{ writingMode: "vertical-lr" }}
      >
        {props.params.studio === session.session?.username
          ? "Home"
          : props.params.studio}
      </div>

      {!session.session && (
        <div className="px-3 pb-1 pt-3">
          <LoginButton small />
        </div>
      )}
      <div className="mx-1 pb-2 pt-3">
        <Divider />
      </div>

      <HomeTabs
        username={props.params.studio}
        className="mx-auto flex flex-col gap-2"
        collapsed={true}
      />
    </>
  );
};
