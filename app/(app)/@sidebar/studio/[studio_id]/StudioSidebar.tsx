"use client";
import { Divider } from "components/Layout";
import { TabsList } from "./StudioTabs";
import { Props } from "app/(app)/studio/[studio_id]/StudioPage";
import { useState } from "react";
import Link from "next/link";
import { BaseSpaceCard } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";
import {
  RoomSearch,
  RoomStudios,
  RoomSettings,
  DisclosureExpandTiny,
  RoomSpaces,
  RoomMember,
} from "components/Icons";
import { LoginButton } from "components/LoginModal";
import { StudioRoleBadge } from "./StudioRoleBadge";
import { useSidebarState } from "../../SidebarState";
import { useSpring, animated } from "@react-spring/web";
import { useAuth } from "hooks/useAuth";

export const StudioSidebarContent = (props: Props & { isAdmin: boolean }) => {
  let { open, toggleSidebar } = useSidebarState((state) => state);

  let sidebarSpring = useSpring({
    width: open ? 256 : 36,
  });
  let disclosureSpring = useSpring({
    rotate: open ? 90 : -90,
  });
  let { session } = useAuth();

  return (
    <>
      <animated.div style={sidebarSpring}>
        <div className="sidebarStudio flex h-full flex-col items-stretch">
          <div className="flex items-center justify-between px-3">
            {open && (
              <Link
                href={
                  session.session?.username
                    ? `/s/${session.session.username}`
                    : "/"
                }
                className="sidebarBreadcrumb text-grey-55 flex shrink-0 flex-row text-sm"
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
            <StudioSidebarExpanded {...props} />
          ) : (
            <StudioSidebarCollapsed {...props} />
          )}
        </div>
      </animated.div>
    </>
  );
};

const StudioSidebarExpanded = (
  props: Props & {
    isAdmin: boolean;
  }
) => {
  let [spaceSearchInput, setSpaceSearchInput] = useState("");

  return (
    <>
      <div className="sidesbarStudioName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
        {props.data.name}
      </div>
      <div className="px-3 pt-3">
        <StudioRoleBadge data={props.data} isAdmin={props.isAdmin} />
      </div>
      <div className="py-3">
        <Divider />
      </div>
      <div className="px-3 pb-2">
        <input
          value={spaceSearchInput}
          onChange={(e) => setSpaceSearchInput(e.target.value)}
          placeholder="search studio (ctrl/⌘ K)"
          className="false w-full px-2 py-1 text-sm outline-none"
        />
      </div>
      {spaceSearchInput === "" ? (
        <TabsList
          className="StudioTabs flex flex-col gap-0.5 px-3 "
          {...props}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {props.data.spaces_in_studios
            .filter((space) =>
              space.space_data.display_name
                .toLocaleLowerCase()
                .includes(spaceSearchInput.toLocaleLowerCase())
            )
            .map((space) => (
              <Link
                href={`/studio/${uuidToBase62(
                  props.data.id
                )}/space/${uuidToBase62(space.space_data.id)}`}
              >
                <BaseSpaceCard {...space.space_data} />{" "}
              </Link>
            ))}
        </div>
      )}
    </>
  );
};

const StudioSidebarCollapsed = (
  props: Props & {
    isAdmin: boolean;
  }
) => {
  let { session } = useAuth();
  return (
    <div className="sidebarHomeCollapsed flex flex-col justify-center pt-3">
      <div
        className="sidebarSpaceName mx-auto h-fit w-fit shrink-0 rotate-180 flex-row font-bold "
        style={{ writingMode: "vertical-lr" }}
      >
        {props.data.name}
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
        <div className="hover:border-grey-80 shrink-0 rounded-md border border-transparent p-1">
          <div className="bg-test-pink h-4 w-4" />
        </div>
        <div className=" border-accent-blue bg-accent-blue shrink-0 rounded-md border p-1  text-white">
          <RoomSpaces />
        </div>
        <div className="hover:border-grey-80 shrink-0 rounded-md border border-transparent p-1">
          <RoomMember />
        </div>
      </div>
    </div>
  );
};