import { getSpaceData } from "app/(app)/s/[studio]/s/[space]/[display_name]/utils";
import { SpaceProvider } from "components/ReplicacheProvider";
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
        {result.data.display_name}
      </div>
      <SpaceProvider
        id={result.data.do_id}
        data={{ space_id: result.data.id, studio_id: undefined }}
      >
        <Sidebar space_id={result.data.id} />
      </SpaceProvider>
    </>
  );
}
