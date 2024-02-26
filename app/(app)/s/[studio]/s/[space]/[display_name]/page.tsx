import { SpaceProvider } from "components/ReplicacheProvider";
import { PageHeightContainer } from "components/PageHeightContainer";
import { Space } from "components/Space";
import { SpacePageStudioPresenceHandler } from "app/(app)/studio/[studio_id]/space/StudioPresenceHandler";
import { UpdateSpaceNameURL } from "./updateDisplayName";
import { getData, redirectToIDURL } from "./utils";

export async function generateMetadata(props: {
  params: { space: string; studio: string };
}) {
  let data = await getData(props.params);
  return {
    title: data.data?.display_name || "404 Space Not Found",
  };
}

export default async function SpacePage(props: {
  params: { space: string; studio: string };
}) {
  let result = await getData(props.params);
  if (!result.success)
    return redirectToIDURL(props.params, <div>space not found</div>);

  return (
    <>
      <UpdateSpaceNameURL display_name={result.data.display_name || ""} />
      <SpaceProvider
        id={result.data.do_id}
        data={{ space_id: result.data.id, studio_id: undefined }}
      >
        <PageHeightContainer>
          <Space space_id={result.data.id} />
        </PageHeightContainer>
      </SpaceProvider>
      <SpacePageStudioPresenceHandler space={result.data} />
    </>
  );
}
