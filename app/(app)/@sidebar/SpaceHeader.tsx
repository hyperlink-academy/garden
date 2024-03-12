"use client";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { useAuth } from "hooks/useAuth";
import { useParams } from "next/dist/client/components/navigation";
import Link from "next/link";
import { create } from "zustand";
import { base62ToUuid, uuidToBase62 } from "src/uuidHelpers";
import { useState } from "react";

export function SpaceHeader(props: {
  children: React.ReactNode;
  context: { type: "user"; username: string } | { type: "studio"; id: string };
  spaces: SpaceData[];
  path: Array<{ name: string; link: string }>;
}) {
  let [switcher, setSwitcher] = useState(false);
  let { session } = useAuth();
  let params = useParams();
  let activeSpace = props.spaces.find((s) =>
    props.context.type === "user"
      ? s.id === base62ToUuid(params?.space as string)
      : s.id === params?.space_id
  );

  return (
    <div>
      <div>
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
            <button onClick={() => setSwitcher(!switcher)}>switch</button>
          </div>
        </div>
        <div className="sidebarSpaceName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
          {activeSpace?.display_name}
        </div>
      </div>
      {switcher ? (
        <div className="pr-2">
          {props.spaces.map((space) => (
            <Link
              key={space.id}
              href={
                props.context.type === "studio"
                  ? `/studio/${uuidToBase62(props.context.id)}/space/${
                      space.id
                    }`
                  : `/s/${props.context.username}/s/${uuidToBase62(space.id)}/${
                      space.display_name
                    }`
              }
            >
              <BaseSpaceCard {...space} />
            </Link>
          ))}{" "}
        </div>
      ) : (
        props.children
      )}
    </div>
  );
}
