"use client";
import { Divider } from "components/Layout";
import { TabsList } from "./StudioTabs";
import { Props } from "app/(app)/studio/[studio_id]/StudioPage";
import { useState } from "react";
import Link from "next/link";
import { SmallSpaceCard } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";
import { StudioRoleBadge } from "./StudioRoleBadge";
import SidebarLayout from "../../SidebarLayout";
import { SearchResults, SidebarSearchInput } from "../../SidebarSearch";
import { useRouter } from "next/navigation";
import { MobileHeaderTitle } from "../../MobileHeaderTitle";
import { isAppleDevice } from "@react-aria/utils";

export const StudioSidebarContent = (props: Props & { isAdmin: boolean }) => {
  return (
    <SidebarLayout
      headerContent={<StudioMobileHeader {...props} />}
      openContent={<StudioSidebarExpanded {...props} />}
      collapsedContent={<StudioSidebarCollapsed {...props} />}
      breadcrumb={null}
      header={
        <>
          <div className="sidesbarStudioName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
            {props.data.name}
          </div>
          <div className="px-3 pt-3">
            <StudioRoleBadge data={props.data} isAdmin={props.isAdmin} />
          </div>
        </>
      }
    />
  );
};

const StudioSidebarExpanded = (
  props: Props & {
    isAdmin: boolean;
  }
) => {
  let [spaceSearchInput, setSpaceSearchInput] = useState("");
  let [selectedItemIndex, setSelectedItemIndex] = useState(0);
  let spaces = props.data.spaces_in_studios
    .filter((space) =>
      space.space_data.display_name
        .toLocaleLowerCase()
        .includes(spaceSearchInput.toLocaleLowerCase())
    )
    .sort(({ space_data: a }, { space_data: b }) => {
      if (!a.display_name || !b.display_name) {
        if (a.display_name) return -1;
        if (b.display_name) return 1;
        return 0;
      }
      return a.display_name.localeCompare(b.display_name);
    });
  let router = useRouter();

  return (
    <>
      <div className="px-3 pb-2">
        <SidebarSearchInput
          resultsLength={spaces.length}
          selectedItemIndex={selectedItemIndex}
          onEnter={() => {
            let item = spaces[selectedItemIndex];
            if (item) {
              router.push(
                `/studio/${uuidToBase62(props.data.id)}/space/${
                  item.space_data.id
                }`
              );
            }
          }}
          setSelectectedItemIndex={setSelectedItemIndex}
          value={spaceSearchInput}
          onChange={(e) => setSpaceSearchInput(e)}
          placeholder={`search studio (${isAppleDevice() ? "⌘" : "⌃"}-K)`}
        />
      </div>
      {spaceSearchInput === "" ? (
        <TabsList
          collapsed={false}
          className="StudioTabs flex flex-col gap-0.5 px-3 "
          {...props}
        />
      ) : (
        <SearchResults
          results={spaces}
          getKey={(space) => space.space_id}
          selectedItemIndex={selectedItemIndex}
          renderResult={(space) => (
            <Link
              key={space.space_id}
              href={`/studio/${uuidToBase62(props.data.id)}/space/${
                space.space_data.id
              }`}
            >
              <SmallSpaceCard {...space.space_data} />
            </Link>
          )}
        />
      )}
    </>
  );
};

const StudioMobileHeader = (
  props: Props & {
    isAdmin: boolean;
  }
) => {
  return (
    <div className="sidebarStudioMobile flex flex-row justify-center gap-4">
      <MobileHeaderTitle title={props.data.name} />

      <TabsList
        collapsed={true}
        className=" mx-auto flex flex-row gap-1 text-grey-35"
        {...props}
      />
    </div>
  );
};

const StudioSidebarCollapsed = (
  props: Props & {
    isAdmin: boolean;
  }
) => {
  return (
    <div className="sidebarStudioCollapsed flex flex-col justify-center">
      <div
        className="sidebarSpaceName mx-auto h-fit w-fit shrink-0 rotate-180 flex-row font-bold "
        style={{ writingMode: "vertical-lr" }}
      >
        {props.data.name}
      </div>

      <div className="pb-2 pt-3">
        <Divider />
      </div>
      <TabsList
        collapsed={true}
        className=" mx-auto flex flex-col gap-1 text-grey-35"
        {...props}
      />
    </div>
  );
};
