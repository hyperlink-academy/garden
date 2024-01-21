import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { SpaceProvider } from "components/ReplicacheProvider";
import { PageHeightContainer } from "components/PageHeightContainer";
import { Space } from "components/Space";

export async function generateMetadata(props: {
  params: { space: string; studio: string };
}) {
  let data = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: decodeURIComponent(props.params.space),
    username: decodeURIComponent(props.params.studio),
  });
  return { title: data.data?.display_name || "404 Space Not Found" };
}

export default async function SpacePage(props: {
  params: { space: string; studio: string };
}) {
  let result = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: decodeURIComponent(props.params.space),
    username: decodeURIComponent(props.params.studio),
  });
  if (!result.success) return <pre>{JSON.stringify(result, null, 2)}</pre>;

  return (
    <SpaceProvider id={result.data.do_id}>
      <PageHeightContainer>
        <Space />
      </PageHeightContainer>
    </SpaceProvider>
  );
}
