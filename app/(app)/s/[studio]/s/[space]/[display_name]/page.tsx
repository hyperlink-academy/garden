import { SpaceProvider } from "components/ReplicacheProvider";
import { Space } from "components/Space";
import { SpacePageStudioPresenceHandler } from "app/(app)/studio/[studio_id]/space/StudioPresenceHandler";
import { UpdateSpaceNameURL } from "./updateDisplayName";
import { getSpaceData, redirectToIDURL } from "./utils";

export async function generateMetadata(props: {
  params: { space: string; studio: string };
}) {
  let data = await getSpaceData(props.params);
  return {
    title: data.data?.display_name || "404 Space Not Found",
  };
}

export default async function SpacePage(props: {
  params: { space: string; studio: string };
}) {
  let result = await getSpaceData(props.params);
  if (!result.success)
    return redirectToIDURL(props.params, <div>space not found</div>);

  return (
    <>
      <UpdateSpaceNameURL display_name={result.data.display_name || ""} />
      <SpaceProvider
        id={result.data.do_id}
        data={{ space_id: result.data.id, studio_id: undefined }}
      >
        <Space space_id={result.data.id} />
      </SpaceProvider>
      <SpacePageStudioPresenceHandler space={result.data} />
    </>
  );
}
