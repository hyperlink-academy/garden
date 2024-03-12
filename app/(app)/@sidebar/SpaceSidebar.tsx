"use client";
import { Divider } from "components/Layout";
import { SpaceRoleBadge } from "components/Space";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { Sidebar } from "components/SpaceLayout";
import { SearchResults, useSearch } from "components/Search";

export function SpaceSidebar(props: {
  display_name: string | null;
  space_id: string;
  do_id: string;
  path: Array<{ name: string; link: string }>;
}) {
  let { input, setInput, results } = useSearch();
  let { session } = useAuth();
  return (
    <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch">
      <div className="flex items-center justify-between px-3">
        <div className="sidebarBreadcrumb text-grey-55 flex shrink-0 flex-row text-sm">
          <div className="sidebarBreadcrumbHome text-grey-55 flex shrink-0 flex-row items-center gap-1 text-sm">
            <Link
              href={session.session ? `/s/${session.session.username}` : "/"}
              className="flex gap-1"
            >
              <div className="hover:text-accent-blue font-bold">h</div>
              <div className="font-bold">/</div>
            </Link>
            {props.path.map((p, index) => (
              <Link href={p.link} key={index}>
                <div className="SidebarBreadcrumbStudio flex gap-1">
                  <div className="hover:text-accent-blue">{p.name}</div>
                  <div>/</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebarSpaceName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
        {props.display_name}
      </div>
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
