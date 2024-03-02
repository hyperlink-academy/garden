// SIDEBAR FOR USER HOME

"use client";

import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { Divider } from "components/Layout";
import { RoomSettings, RoomSpaces, RoomStudios } from "components/Icons";
import { SidebarTab } from "../../SidebarTab";

export default function UserPageSidebar(props: { params: { studio: string } }) {
  let { session } = useAuth();
  return (
    <>
      <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch gap-1">
        <div className="flex items-center justify-between px-3">
          <Link
            href={session.session ? `/s/${session.session.username}` : "/"}
            className="sidebarBreadcrumb text-grey-55 flex shrink-0 flex-row text-sm"
          >
            <div className="flex gap-1">
              <div className="font-bold">h</div>
              <div className="font-bold">/</div>
            </div>
          </Link>
        </div>
        <div className="sidebarSpaceName shrink-0 flex-row px-3 text-lg font-bold">
          Home
        </div>
        <div className="px-3">
          <input
            placeholder="search home (ctrl/⌘ K)"
            className="false w-full px-2 py-1 text-sm outline-none"
          />
        </div>
        <div className="pb-1 pt-2">
          <Divider />
        </div>
        <div className="flex flex-col gap-0.5 px-3">
          <SidebarTab title="Spaces" icon=<RoomSpaces /> active={true} />
          <SidebarTab title="Studios" icon=<RoomStudios /> active={false} />
          {session?.session?.username === props.params.studio && (
            <SidebarTab title="Settings" icon=<RoomSettings /> active={false} />
          )}
        </div>
      </div>
    </>
  );
}

const Tab = (props: { icon?: React.ReactNode; name: string }) => {
  return (
    <div className="flex items-center gap-1">
      {props?.icon}
      {props.name}
    </div>
  );
};
