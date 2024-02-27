import { Tabs } from "app/(app)/studio/[studio_id]/StudioPage";
import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import { supabaseServerClient } from "supabase/server";
import { TabsList } from "./StudioTabs";

export default async function StudioSidebar(props: {
  params: { studio_id: string };
}) {
  let data = await getStudioPageData(props.params.studio_id);
  if (!data.data) return null;
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  let isAdmin = data.data.creator === session?.data.user?.id;

  return (
    <div className="studioNav border-grey-80 my-6 mr-4 w-64 flex-col justify-between border-r pr-4">
      <div className="flex w-full flex-col gap-2 text-right">
        <div className="flex flex-col gap-0">
          <h3
            style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
          >
            {data?.data.name}
          </h3>
        </div>
        <TabsList
          className="StudioTabs flex flex-col gap-2 "
          data={data.data}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
