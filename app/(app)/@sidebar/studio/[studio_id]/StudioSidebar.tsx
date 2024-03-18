"use client";
import { Divider } from "components/Layout";
import { TabsList } from "./StudioTabs";
import { Props } from "app/(app)/studio/[studio_id]/StudioPage";
import { useState } from "react";
import Link from "next/link";
import { BaseSpaceCard } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";
import { LoginButton } from "components/LoginModal";
import { StudioRoleBadge } from "./StudioRoleBadge";
import { useAuth } from "hooks/useAuth";
import SidebarLayout from "../../SidebarLayout";
import { useSidebarState } from "../../SidebarState";

export const StudioSidebarContent = (props: Props & { isAdmin: boolean }) => {
  let { open } = useSidebarState((state) => state);
  let { session } = useAuth();
  return (
    <SidebarLayout
      breadcrumb={
        <Link
          href={
            session.session?.username ? `/s/${session.session.username}` : "/"
          }
          className="sidebarBreadcrumb flex shrink-0 flex-row text-sm text-grey-55"
        >
          <div className="flex gap-1">
            <div className="font-bold hover:text-accent-blue">h</div>
            <div className="font-bold">/</div>
          </div>
        </Link>
      }
    >
      {open ? (
        <StudioSidebarExpanded {...props} />
      ) : (
        <StudioSidebarCollapsed {...props} />
      )}
    </SidebarLayout>
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
          collapsed={false}
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
                key={space.space_id}
                href={`/studio/${uuidToBase62(props.data.id)}/space/${
                  space.space_data.id
                }`}
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
    <div className="sidebarHomeCollapsed flex flex-col justify-center">
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
      <TabsList
        collapsed={true}
        className=" mx-auto flex flex-col gap-1 text-grey-55"
        {...props}
      />
    </div>
  );
};
