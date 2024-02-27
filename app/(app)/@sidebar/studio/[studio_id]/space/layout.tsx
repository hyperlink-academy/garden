import { getStudioPageData } from "app/(app)/studio/[studio_id]/page";
import { SpaceSwitcher } from "app/(app)/studio/[studio_id]/space/SpaceViewerHeader";

export default async function StudioSpaceSidebar(props: {
  params: { studio_id: string; space_id: string };
  children: React.ReactNode;
}) {
  let data = await getStudioPageData(props.params.studio_id);
  if (!data.success) return <>404</>;
  let spaces = data.data.spaces_in_studios.map((x) => x.space_data);
  return (
    <div className="flex h-full flex-col ">
      <SpaceSwitcher spaces={spaces} />
      {props.children}
    </div>
  );
}
