import { base62ToUuid } from "src/uuidHelpers";
import { SpaceViewer } from "./SpaceViewer";
import { PageHeightContainer } from "components/PageHeightContainer";
import { StudioPresenceHandler } from "./StudioPresenceHandler";
import { getStudioPageData } from "../page";
export const fetchCache = "force-no-store";

export default async function StudioSpaceLayout(props: {
  params: { studio_id: string };
  children: React.ReactNode;
}) {
  let id = props.params.studio_id as string;
  if (id.length !== 36) id = base62ToUuid(id);

  let data = await getStudioPageData(id);
  if (!data.success) return <>404</>;
  let spaces = data.data.spaces_in_studios.map((x) => x.space_data);

  return (
    <PageHeightContainer>
      <StudioPresenceHandler
        spaces={spaces}
        studio_do_id={data.data.do_id}
        studio_id={data.data.id}
      />
      <SpaceViewer
        studioName={data.data.name}
        spaces={spaces}
        studioID={data.data.id}
      />
    </PageHeightContainer>
  );
}
