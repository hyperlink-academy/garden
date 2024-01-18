import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { redirect } from "next/navigation";
import { WORKER_URL } from "src/constants";
import { supabaseServerClient } from "supabase/server";
import { JoinSpace } from "./JoinSpace";

export async function generateMetadata(props: {
  params: { space: string; studio: string };
}) {
  let data = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: props.params.space,
    username: props.params.studio,
  });
  return {
    title: data.data?.display_name
      ? `${data.data.display_name}: you're invited!`
      : "404 Space Not Found",
  };
}

export default async function JoinSpacePage(props: {
  params: { space: string; studio: string };
}) {
  let data = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: props.params.space,
    username: props.params.studio,
  });
  if (!data.success) return <div>404 - page not found!</div>;
  let supabase = supabaseServerClient();
  let { data: user } = await supabase.auth.getUser();
  if (
    user.user &&
    data.data.members_in_spaces.find(
      (member) => member.member === user.user?.id
    )
  )
    redirect(`/s/${props.params.studio}/${props.params.space}}`);

  return (
    <SpaceProvider id={data.data.do_id}>
      <JoinSpace />
    </SpaceProvider>
  );
}
