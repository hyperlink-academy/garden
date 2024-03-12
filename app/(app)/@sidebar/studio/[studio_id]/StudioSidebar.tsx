"use client";
import { Divider } from "components/Layout";
import { TabsList } from "./StudioTabs";
import { Props } from "app/(app)/studio/[studio_id]/StudioPage";
import { useState } from "react";
import Link from "next/link";
import { BaseSpaceCard } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";

export function StudioSidebarContent(
  props: Props & {
    isAdmin: boolean;
  }
) {
  let [spaceSearchInput, setSpaceSearchInput] = useState("");
  return (
    <>
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
}
