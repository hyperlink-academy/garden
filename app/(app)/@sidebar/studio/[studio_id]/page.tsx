// SIDEBAR FOR STUDIO PAGE

import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import Link from "next/link";
import { supabaseServerClient } from "supabase/server";
import { TabsList } from "./StudioTabs";
import { Divider } from "components/Layout";

export default async function StudioSidebar(props: {
  params: { studio_id: string };
}) {
  let data = await getStudioPageData(props.params.studio_id);
  if (!data.data) return null;
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  let isAdmin = data.data.creator === session?.data.user?.id;

  return (
    <>
      <div className="sidebarStudio flex h-full flex-col items-stretch gap-1">
        <div className="flex items-center justify-between px-3">
          <Link
            href={
              session.data.user
                ? `/s/${session.data.user.user_metadata.username}`
                : "/"
            }
            className="sidebarBreadcrumb text-grey-55 flex shrink-0 flex-row text-sm"
          >
            <div className="flex gap-1">
              <div className="font-bold">h</div>
              <div className="font-bold">/</div>
            </div>
          </Link>
        </div>
        <div className="sidebarStudioName shrink-0 flex-row px-3 text-lg font-bold">
          {data?.data.name}
        </div>
        <div className="px-3">
          <input
            placeholder="search studio (ctrl/⌘ K)"
            className="false w-full px-2 py-1 text-sm outline-none"
          />
        </div>
        <div className="pb-1 pt-2">
          <Divider />
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-0.5 px-3">
            <TabsList
              className="StudioTabs flex flex-col gap-2 "
              data={data.data}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </>
  );
}
