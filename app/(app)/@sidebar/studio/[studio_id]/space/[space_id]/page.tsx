// SIDEBAR FOR SPACE FROM STUDIO

import { SpaceSidebar } from "app/(app)/@sidebar/SpaceSidebar";
import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import { SpaceProvider } from "components/ReplicacheProvider";

export default async function SpaceInStudioSidebar(props: {
  params: { studio_id: string; space_id: string };
}) {
  let data = await getStudioPageData(props.params.studio_id);
  if (!data.success) return <>404</>;
  let spaces = data.data.spaces_in_studios.map((x) => x.space_data);
  let activeSpace = spaces.find((x) => x.id === props.params?.space_id);
  if (!activeSpace) return <>404</>;

  return (
    <>
      <SpaceProvider
        id={activeSpace.do_id}
        data={{ space_id: activeSpace.id, studio_id: undefined }}
      >
        <SpaceSidebar
          space_id={activeSpace.id}
          do_id={activeSpace.do_id}
          display_name={activeSpace.display_name}
        />
      </SpaceProvider>
    </>
  );
}
