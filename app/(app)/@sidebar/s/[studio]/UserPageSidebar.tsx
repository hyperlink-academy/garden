// SIDEBAR FOR USER HOME

"use client";

import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { Divider } from "components/Layout";
import { HomeTabs } from "./HomeTabs";
import { LoginButton } from "components/LoginModal";
import SidebarLayout from "../../SidebarLayout";
import { useState } from "react";
import { SmallSpaceCard, SpaceData } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";
import { SearchResults, SidebarSearchInput } from "../../SidebarSearch";
import { useRouter } from "next/navigation";

export function UserPageSidebar(props: {
  params: { studio: string };
  spaces: SpaceData[];
}) {
  let { session } = useAuth();

  return (
    <SidebarLayout
      openContent={<UserPageSidebarExpanded {...props} />}
      collapsedContent={<UserPageSidebarCollapsed {...props} />}
      headerContent={<UserPageHeader {...props} />}
      breadcrumb={null}
      header={
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
        </>
      }
    />
  );
}

const UserPageSidebarExpanded = (props: {
  params: { studio: string };
  spaces: SpaceData[];
}) => {
  let [search, setSearch] = useState("");
  let [selectedItemIndex, setSelectedItemIndex] = useState(0);
  let results = props.spaces
    .filter((space) =>
      space.display_name
        ?.toLocaleLowerCase()
        .includes(search.toLocaleLowerCase())
    )
    .sort((a, b) => {
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
      <div className="px-3 pb-3">
        <SidebarSearchInput
          onEnter={() => {
            let space = results[selectedItemIndex];
            if (space)
              router.push(
                `/s/${space.owner.username}/s/${uuidToBase62(space.id)}/${
                  space.display_name
                }`
              );
          }}
          selectedItemIndex={selectedItemIndex}
          setSelectectedItemIndex={setSelectedItemIndex}
          resultsLength={results.length}
          value={search}
          onChange={(e) => setSearch(e)}
          placeholder="search home (ctrl/⌘ K)"
        />
      </div>
      {search === "" ? (
        <HomeTabs
          username={props.params.studio}
          className="flex flex-col gap-0.5 px-3"
          collapsed={false}
        />
      ) : (
        <SearchResults
          results={results}
          selectedItemIndex={selectedItemIndex}
          getKey={(space) => space.id}
          renderResult={(space) => (
            <Link
              key={space.id}
              href={`/s/${space.owner.username}/s/${uuidToBase62(space.id)}/${
                space.display_name
              }`}
            >
              <SmallSpaceCard {...space} />
            </Link>
          )}
        />
      )}
    </>
  );
};

const UserPageHeader = (props: { params: { studio: string } }) => {
  let { session } = useAuth();
  return (
    <>
      <div className="sidebarSpaceName mx-auto h-fit w-fit shrink-0 flex-row font-bold ">
        {props.params.studio === session.session?.username
          ? "Home"
          : props.params.studio}
      </div>

      <HomeTabs
        username={props.params.studio}
        className="mx-auto flex flex-row gap-1 text-grey-55"
        collapsed={true}
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

      <div className="pb-2 pt-3">
        <Divider />
      </div>

      <HomeTabs
        username={props.params.studio}
        className="mx-auto flex flex-col gap-1 text-grey-55"
        collapsed={true}
      />
    </>
  );
};
