import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import Link from "next/link";
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
    <>
      <div className="flex flex-row">
        <Link
          href={
            session.data.user
              ? `/s/${session.data.user.user_metadata.username}`
              : "/"
          }
        >
          h/
        </Link>
        {data?.data.name}
      </div>
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-col gap-0">
          <h3
            style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
          ></h3>
        </div>
        <TabsList
          className="StudioTabs flex flex-col gap-2 "
          data={data.data}
          isAdmin={isAdmin}
        />
      </div>
    </>
  );
}
