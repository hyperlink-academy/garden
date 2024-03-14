// SIDEBAR FOR STUDIO PAGE
import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import { supabaseServerClient } from "supabase/server";
import { StudioSidebarContent } from "./StudioSidebar";

export default async function StudioSidebar(props: {
  params: { studio_id: string };
}) {
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  let data = await getStudioPageData(props.params.studio_id);
  if (!data.data) return null;

  let isAdmin = data.data.creator === session?.data.user?.id;

  return (
    <>
      <StudioSidebarContent isAdmin={isAdmin} data={data.data} />
    </>
  );
}
