// SIDEBAR FOR USER HOME

"use client";

import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { Divider } from "components/Layout";
import { HomeTabs } from "./HomeTabs";
import { LoginButton } from "components/LoginModal";
import { useSidebarState } from "../../SidebarState";
import { useSpring, animated } from "@react-spring/web";
import {
  DisclosureExpandTiny,
  RoomSearch,
  RoomSettings,
  RoomStudios,
} from "components/Icons";

export default function UserPageSidebar(props: { params: { studio: string } }) {
  let { open, toggleSidebar } = useSidebarState((state) => state);
  let { session } = useAuth();

  let sidebarSpring = useSpring({
    width: open ? 256 : 36,
  });
  let disclosureSpring = useSpring({
    rotate: open ? 90 : -90,
  });

  return (
    <animated.div style={sidebarSpring}>
      <div className="sidebarHome flex h-full flex-col items-stretch gap-0">
        <div className="sidebarHomeBreadcrumb flex items-center justify-between px-3">
          {open && (
            <Link
              className="sidebarBreadcrumb text-grey-55 flex shrink-0 flex-row items-center text-sm"
              href={session.session ? `/s/${session.session.username}` : "/"}
            >
              <div className="flex gap-1">
                <div className="hover:text-accent-blue font-bold">h</div>
                <div className="font-bold">/</div>
              </div>
            </Link>
          )}
          <animated.div style={disclosureSpring}>
            <button
              className="hover:text-accent-blue text-grey-55 "
              onClick={() => toggleSidebar()}
            >
              <DisclosureExpandTiny />
            </button>
          </animated.div>
        </div>

        {open ? (
          <UserPageSidebarExpanded {...props} />
        ) : (
          <UserPageSidebarCollapsed {...props} />
        )}
      </div>
    </animated.div>
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
      <HomeTabs username={props.params.studio} />
    </>
  );
};

const UserPageSidebarCollapsed = (props: { params: { studio: string } }) => {
  let { session } = useAuth();

  return (
    <div className="sidebarHomeCollapsed flex flex-col justify-center pt-3">
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
      <div className=" mx-auto flex flex-col gap-2">
        <div className="hover:border-grey-80 shrink-0 rounded-md border border-transparent p-1">
          <RoomSearch />
        </div>
        <div className=" border-accent-blue bg-accent-blue shrink-0 rounded-md border p-1  text-white">
          <RoomStudios />
        </div>
        <div className="hover:border-grey-80 shrink-0 rounded-md border border-transparent p-1">
          <RoomSettings />
        </div>
      </div>
    </div>
  );
};
