"use client";
import {
  BaseSpaceCard,
  SmallSpaceCard,
  SpaceData,
} from "components/SpacesList";
import { useAuth } from "hooks/useAuth";
import { useParams } from "next/dist/client/components/navigation";
import Link from "next/link";
import { base62ToUuid, uuidToBase62 } from "src/uuidHelpers";
import { useState } from "react";
import { useIdentityData } from "hooks/useIdentityData";
import SidebarLayout from "./SidebarLayout";
import { useSidebarState } from "./SidebarState";
import { Truncate } from "components/Truncate";
import { Switch } from "components/Icons";

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

  let { open } = useSidebarState();

  return (
    <SidebarLayout
      breadcrumb={
        <div className="sidebarBreadcrumb flex shrink-0 flex-row items-center text-sm text-grey-55">
          <div className="sidebarBreadcrumbHome flex shrink-0 flex-row items-center gap-1 text-sm text-grey-55">
            <Link
              href={session.session ? `/s/${session.session.username}` : "/"}
              className="flex gap-1"
            >
              <div className="font-bold hover:text-accent-blue">h</div>
              <div className="font-bold">/</div>
            </Link>
            {isUserSpace === false &&
              props.path.map((p, index) => (
                <Link href={p.link} key={index}>
                  <div className="SidebarBreadcrumbStudio flex gap-1">
                    <div className="min-w-0 max-w-[16ch] hover:text-accent-blue">
                      <Truncate className="w-full max-w-none overflow-hidden bg-white">
                        {p.name}
                      </Truncate>
                    </div>
                    <div>/</div>
                  </div>
                </Link>
              ))}
          </div>
          <button
            className="ml-0.5 h-fit rounded-[2px] px-0.5 pb-[1px] hover:bg-accent-blue hover:text-white"
            onClick={() => setSwitcher(!switcher)}
          >
            <Switch />
          </button>
        </div>
      }
    >
      <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch">
        {open ? (
          <div>
            <div className="flex items-center justify-between px-3"></div>
            <div className="sidebarSpaceName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
              {activeSpace?.display_name}
            </div>
          </div>
        ) : (
          <div
            className="sidebarSpaceName mx-auto h-fit w-fit shrink-0 rotate-180 flex-row font-bold "
            style={{ writingMode: "vertical-lr" }}
          >
            {activeSpace?.display_name}
          </div>
        )}
        <div className="sidebarContent grow">
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
                        : `/s/${space.owner.username}/s/${uuidToBase62(
                            space.id
                          )}/${space.display_name}`
                    }
                  >
                    <SmallSpaceCard {...space} />
                  </Link>
                ))}{" "}
            </div>
          ) : (
            props.children
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
