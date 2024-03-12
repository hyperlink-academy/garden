// SIDEBAR FOR STUDIO PAGE

import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import Link from "next/link";
import { supabaseServerClient } from "supabase/server";
import { TabsList } from "./StudioTabs";
import { Divider } from "components/Layout";
import { StudioRoleBadge } from "./StudioRoleBadge";
import { StudioSidebarContent } from "./StudioSidebar";

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
      <div className="sidebarStudio flex h-full flex-col items-stretch">
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
              <div className="hover:text-accent-blue font-bold">h</div>
              <div className="font-bold">/</div>
            </div>
          </Link>
        </div>
        <div className="sidesbarStudioName shrink-0 flex-row px-3 pt-0.5 text-lg font-bold">
          {data?.data.name}
        </div>
        <div className="px-3 pt-3">
          <StudioRoleBadge data={data.data} isAdmin={isAdmin} />
        </div>
        <StudioSidebarContent data={data.data} isAdmin={isAdmin} />
      </div>
    </>
  );
}
