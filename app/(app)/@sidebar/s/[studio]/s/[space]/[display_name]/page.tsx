// SIDEBAR FOR SPACE FROM HOME

import { SpaceSidebar } from "app/(app)/@sidebar/SpaceSidebar";
import { getSpaceData } from "app/(app)/s/[studio]/s/[space]/[display_name]/utils";
import { SpaceProvider } from "components/ReplicacheProvider";

export default async function SpaceInUserSidebar(props: {
  params: { space: string; studio: string };
}) {
  let result = await getSpaceData(props.params);
  if (!result.success || !result.data) return null;
  return (
    <SpaceProvider
      id={result.data.do_id}
      data={{ space_id: result.data.id, studio_id: undefined }}
    >
      <SpaceSidebar
        space_id={result.data.id}
        do_id={result.data.do_id}
        display_name={result.data?.display_name}
      />
    </SpaceProvider>
  );
}
