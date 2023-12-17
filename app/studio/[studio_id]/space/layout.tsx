import { workerAPI } from "backend/lib/api";
import Link from "next/link";
import { WORKER_URL } from "src/constants";
import { base62ToUuid } from "src/uuidHelpers";
import { SpaceViewer } from "./SpaceViewer";
import { PageHeightContainer } from "components/PageHeightContainer";

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
  return (
    <PageHeightContainer>
      <SpaceViewer
        spaces={data.data.spaces_in_studios.map((x) => x.space_data)}
      >
        {props.children}
      </SpaceViewer>
    </PageHeightContainer>
  );
}
