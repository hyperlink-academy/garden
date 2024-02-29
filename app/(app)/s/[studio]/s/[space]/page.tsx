import { redirect } from "next/navigation";
import { getSpaceData, redirectToIDURL } from "./[display_name]/utils";
import { uuidToBase62 } from "src/uuidHelpers";

export default async function redirectToDisplayName(props: {
  params: { space: string; studio: string };
}) {
  let result = await getSpaceData(props.params);
  if (result.data)
    return redirect(
      `/s/${props.params.studio}/s/${uuidToBase62(result.data.id)}/${
        result.data.display_name
      }`
    );

  return redirectToIDURL(props.params, <div>space not found</div>);
}
