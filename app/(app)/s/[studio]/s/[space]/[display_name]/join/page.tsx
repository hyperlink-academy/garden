import { SpaceProvider } from "components/ReplicacheProvider";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "supabase/server";
import { JoinSpace } from "./JoinSpace";
import { getData, redirectToIDURL } from "../utils";

export async function generateMetadata(props: {
  params: { space: string; studio: string };
}) {
  let data = await getData(props.params);
  return {
    title: data.data?.display_name
      ? `${data.data.display_name}: you're invited!`
      : "404 Space Not Found",
  };
}

export default async function JoinSpacePage(props: {
  params: { space: string; studio: string; display_name: string };
}) {
  let data = await getData(props.params);
  console.log(data, "yooo");
  if (!data.success)
    return redirectToIDURL(props.params, <div>404 - space not found</div>);
  let supabase = supabaseServerClient();
  let { data: user } = await supabase.auth.getUser();
  if (
    user.user &&
    data.data.members_in_spaces.find(
      (member) => member.member === user.user?.id
    )
  )
    redirect(
      `/s/${props.params.studio}/s/${props.params.space}/${props.params.display_name}`
    );

  return (
    <SpaceProvider
      id={data.data.do_id}
      data={{
        space_id: data.data.id,
        studio_id: undefined,
      }}
    >
      <JoinSpace space_id={data.data.id} />
    </SpaceProvider>
  );
}
