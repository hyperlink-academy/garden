import { SpaceHeader } from "app/(app)/@sidebar/SpaceHeader";
import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import { SpaceData } from "components/SpacesList";
import { uuidToBase62 } from "src/uuidHelpers";

export default async function SpaceInUserSidebar(props: {
  params: { studio_id: string };
  children: React.ReactNode;
}) {
  let studioData = await getStudioPageData(props.params.studio_id);
  if (!studioData.data) return null;
  return (
    <SpaceHeader
      spaces={studioData.data.spaces_in_studios.map(
        (s) => s.space_data as SpaceData
      )}
      context={{ type: "studio", ...studioData.data }}
      path={[
        {
          name: studioData.data.name,
          link: `/studio/${uuidToBase62(studioData.data.id)}`,
        },
      ]}
    >
      {props.children}
    </SpaceHeader>
  );
}
