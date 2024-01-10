import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { base62ToUuid } from "src/uuidHelpers";

export async function generateMetadata(props: {
  params: { space_id: string };
}) {
  let id = props.params.space_id;
  if (id.length !== 36) id = base62ToUuid(id);
  let data = await workerAPI(WORKER_URL, "get_space_data_by_id", {
    id,
  });
  return { title: data.data?.display_name || "404 Space Not Found" };
}

export default function StudioSpacePage() {
  return null;
}
