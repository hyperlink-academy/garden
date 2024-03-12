"use client";
import { BaseSpaceCard, SpaceData } from "components/SpacesList";
import { useAuth } from "hooks/useAuth";
import { useParams } from "next/dist/client/components/navigation";
import Link from "next/link";
import { base62ToUuid, uuidToBase62 } from "src/uuidHelpers";
import { useState } from "react";
import { useIdentityData } from "hooks/useIdentityData";

export function SpaceHeader(props: {
  children: React.ReactNode;
  context: { type: "user"; username: string } | { type: "studio"; id: string };
  spaces: SpaceData[];
  path: Array<{ name: string; link: string }>;
}) {
  let [switcher, setSwitcher] = useState(false);
  let { session } = useAuth();
  let params = useParams();
  let { data: userSpaces } = useIdentityData(session.session?.username);
  let activeSpace = props.spaces.find((s) =>
    props.context.type === "user"
      ? s.id === base62ToUuid(params?.space as string)
      : s.id === params?.space_id
  );
  let isUserSpace = false;
  if (
    session.user &&
    activeSpace?.members_in_spaces.find((s) => s.member === session.user?.id) &&
    props.context.type === "user"
  )
    isUserSpace = true;
  let spaces = isUserSpace
    ? userSpaces?.members_in_spaces.map((m) => m.space_data as SpaceData)
    : props.spaces;

  return (
    <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch">
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
              {isUserSpace === false &&
                props.path.map((p, index) => (
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
      <div className="no-scrollbar overflow-y-scroll">
        {switcher ? (
          <div className="pr-2">
            <button onClick={() => setSwitcher(false)}>close</button>
            {spaces
              ?.filter((s) => !s.archived)
              .map((space) => (
                <Link
                  key={space.id}
                  href={
                    props.context.type === "studio"
                      ? `/studio/${uuidToBase62(props.context.id)}/space/${
                          space.id
                        }`
                      : `/s/${props.context.username}/s/${uuidToBase62(
                          space.id
                        )}/${space.display_name}`
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
    </div>
  );
}
