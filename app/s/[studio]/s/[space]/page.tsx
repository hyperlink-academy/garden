import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { SpaceProvider } from "components/ReplicacheProvider";
import { PageHeightContainer } from "components/PageHeightContainer";
import { Space } from "components/Space";

export default async function SpacePage(props: {
  params: { space: string; studio: string };
}) {
  let result = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: props.params.space,
    username: props.params.studio,
  });
  if (!result.success) return <div>Not found</div>;

  return (
    <SpaceProvider id={result.data.do_id}>
      <PageHeightContainer>
        <Space />
      </PageHeightContainer>
    </SpaceProvider>
  );
}
