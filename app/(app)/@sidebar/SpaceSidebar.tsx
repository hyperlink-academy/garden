"use client";
import { Divider } from "components/Layout";
import { SpaceRoleBadge } from "components/Space";
import { Sidebar } from "components/SpaceLayout";
import { SearchResults, useSearch } from "components/Search";

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
  do_id: string;
}) {
  let { input, setInput, results } = useSearch();
  return (
    <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch">
      <div className="px-3 pt-3">
        <SpaceRoleBadge space_id={props.space_id} />
      </div>

      <div className="py-3">
        <Divider />
      </div>
      <div className="px-3 pb-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder="search space (ctrl/⌘ K)"
          className="false w-full px-2 py-1 text-sm outline-none"
        />
      </div>
      {input === "" ? (
        <Sidebar space_id={props.space_id} />
      ) : (
        <SearchResults
          results={results}
          onClick={() => {}}
          suggestionIndex={0}
        />
      )}
    </div>
  );
}
