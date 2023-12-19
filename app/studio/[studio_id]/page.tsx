import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { WORKER_URL } from "src/constants";
import { StudioPageContent } from "./StudioPage";
import { base62ToUuid } from "src/uuidHelpers";
import { supabaseServerClient } from "supabase/server";

export async function generateMetadata(props: {
  params: { studio_id: string };
}) {
  let id = props.params.studio_id;
  if (id.length !== 36) id = base62ToUuid(id);
  let data = await workerAPI(WORKER_URL, "get_studio_data", {
    id,
  });
  return { title: data.data?.name || "404 Studio Not Found" };
}

export default async function StudioPage(props: {
  params: { studio_id: string };
}) {
  let id = props.params.studio_id;
  if (id.length !== 36) id = base62ToUuid(id);
  let data = await workerAPI(WORKER_URL, "get_studio_data", {
    id,
  });
  if (!data.data || !id) return null;
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  let isAdmin = data.data.creator === session?.data.user?.id;
  return (
    <>
      <SpaceProvider id={data?.data.do_id}>
        <StudioPageContent data={data.data} isAdmin={isAdmin} />
      </SpaceProvider>
    </>
  );
}
