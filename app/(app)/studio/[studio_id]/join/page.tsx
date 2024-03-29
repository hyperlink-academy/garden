import { workerAPI } from "backend/lib/api";
import { cache } from "react";
import { WORKER_URL } from "src/constants";
import { base62ToUuid } from "src/uuidHelpers";
import { supabaseServerClient } from "supabase/server";
import { JoinStudio } from "./Join";
import { redirect } from "next/navigation";

const getData = cache((studio_id: string) => {
  let id = studio_id;
  if (id.length !== 36) id = base62ToUuid(id);
  return workerAPI(WORKER_URL, "get_studio_data", { id });
});

export async function generateMetadata(props: {
  params: { studio_id: string };
}) {
  let data = await getData(props.params.studio_id);
  return { title: data.data?.name || "404 Studio Not Found" };
}

export default async function StudioJoinPage(props: {
  params: { studio_id: string };
}) {
  let data = await getData(props.params.studio_id);
  if (!data.data) return null;
  let supabase = supabaseServerClient();
  let session = await supabase.auth.getUser();
  if (
    session?.data.user &&
    data?.data.members_in_studios?.find(
      ({ member }) => session.data.user && session.data.user.id === member
    )
  )
    redirect(`/studio/${props.params.studio_id}`);

  return (
    <>
      <JoinStudio data={data.data} />
    </>
  );
}
