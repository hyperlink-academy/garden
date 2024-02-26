import { workerAPI } from "backend/lib/api";
import { redirect } from "next/navigation";
import { WORKER_URL } from "src/constants";
import { base62ToUuid, uuidToBase62 } from "src/uuidHelpers";

export type Params = { space: string; studio: string };
export async function getData(params: Params) {
  let id = params.space;
  if (id.length !== 36) id = base62ToUuid(id);
  return workerAPI(WORKER_URL, "get_space_data_by_id", {
    id,
  });
}

export async function redirectToIDURL<Fallback>(
  params: Params,
  fallback: Fallback
) {
  let data = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: decodeURIComponent(params.space),
    username: decodeURIComponent(params.studio),
  });
  if (data.success)
    return redirect(
      `/s/${params.studio}/s/${uuidToBase62(data.data.id)}/${
        data.data.display_name
      }`
    );
  return fallback;
}
