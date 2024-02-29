// SIDEBAR FOR SPACE FROM HOME

import { getSpaceData } from "app/(app)/s/[studio]/s/[space]/[display_name]/utils";
import { Divider } from "components/Layout";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceRoleBadge } from "components/Space";
import { Sidebar } from "components/SpaceLayout";
import Link from "next/link";
import { supabaseServerClient } from "supabase/server";

export default async function SpaceInUserSidebar(props: {
  params: { space: string; studio: string };
}) {
  let result = await getSpaceData(props.params);
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  if (!result.success) return null;
  return (
    <div className="sidebarSpaceFromHome flex h-full flex-col items-stretch gap-1">
      <div className="flex items-center justify-between px-3">
        <Link
          className="sidebarBreadcrumb text-grey-55 flex shrink-0 flex-row text-sm"
          href={
            session.data.user
              ? `/s/${session.data.user.user_metadata.username}`
              : "/"
          }
        >
          <div className=" flex gap-1">
            <div className="font-bold">h</div>
            <div className="font-bold">/</div>
            <div>home</div>
            <div> / </div>
          </div>
        </Link>
        <SpaceRoleBadge space_id={result.data.id} />
      </div>

      <div className="sidebarSpaceName shrink-0 flex-row px-3 text-lg font-bold">
        {result.data.display_name}
      </div>
      <div className="pb-2 pt-1">
        <Divider />
      </div>
      <div className="px-3">
        <input
          placeholder="search space (ctrl/⌘ K)"
          className="false w-full px-2 py-1 text-sm outline-none"
        />
      </div>
      <SpaceProvider
        id={result.data.do_id}
        data={{ space_id: result.data.id, studio_id: undefined }}
      >
        <Sidebar space_id={result.data.id} />
      </SpaceProvider>
    </div>
  );
}
