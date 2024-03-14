// SIDEBAR FOR STUDIO PAGE
import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import { supabaseServerClient } from "supabase/server";
import { StudioSidebarContent } from "./StudioSidebar";
import { SpaceProvider } from "components/ReplicacheProvider";

export default async function StudioSidebar(props: {
  params: { studio_id: string };
}) {
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  let data = await getStudioPageData(props.params.studio_id);
  if (!data.data) return null;

  let isAdmin = data.data.creator === session?.data.user?.id;

  return (
    <SpaceProvider
      id={data.data.do_id}
      data={{ studio_id: data.data.id, space_id: undefined }}
    >
      <StudioSidebarContent isAdmin={isAdmin} data={data.data} />
    </SpaceProvider>
  );
}
