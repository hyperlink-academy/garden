import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { base62ToUuid } from "src/uuidHelpers";
import { SpaceViewer } from "./SpaceViewer";
import { PageHeightContainer } from "components/PageHeightContainer";
import { Space } from "components/Space";
import { StudioPresenceHandler } from "./StudioPresenceHandler";
import { useParams } from "next/navigation";
export const fetchCache = "force-no-store";

export default async function StudioSpaceLayout(props: {
  params: { studio_id: string };
  children: React.ReactNode;
}) {
  let id = props.params.studio_id as string;
  if (id.length !== 36) id = base62ToUuid(id);

  let data = await workerAPI(WORKER_URL, "get_studio_data", {
    id,
  });
  if (!data.success) return <>404</>;
  let spaces = data.data.spaces_in_studios.map((x) => x.space_data);

  return (
    <PageHeightContainer>
      <StudioPresenceHandler spaces={spaces} studio_do_id={data.data.do_id} />
      <SpaceViewer studioName={data.data.name} spaces={spaces}>
        <Space
          studio={{
            spaces,
            studioName: data.data.name,
            studioID: data.data.id,
          }}
        />
      </SpaceViewer>
    </PageHeightContainer>
  );
}
