import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import { SpaceSwitcher } from "app/(app)/studio/[studio_id]/space/SpaceViewerHeader";
import { SpaceProvider } from "components/ReplicacheProvider";
import { Sidebar } from "components/SpaceLayout";
import Link from "next/link";
import { supabaseServerClient } from "supabase/server";

export default async function SpaceInStudioSidebar(props: {
  params: { studio_id: string; space_id: string };
}) {
  let data = await getStudioPageData(props.params.studio_id);
  if (!data.success) return <>404</>;
  let spaces = data.data.spaces_in_studios.map((x) => x.space_data);
  let activeSpace = spaces.find((x) => x.id === props.params?.space_id);
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  if (!activeSpace) return <>404</>;

  return (
    <>
      <div className="flex h-full flex-col ">
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
          {data.data.name} / {activeSpace.display_name}
        </div>
      </div>
      <SpaceSwitcher spaces={spaces} />
      <SpaceProvider
        id={activeSpace.do_id}
        data={{ space_id: activeSpace.id, studio_id: undefined }}
      >
        <Sidebar space_id={activeSpace.id} />
      </SpaceProvider>
    </>
  );
}
