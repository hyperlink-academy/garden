import { SpaceHeader } from "app/(app)/@sidebar/SpaceHeader";
import { getUserPageData } from "app/(app)/s/[studio]/getUserPageData";
import { SpaceData } from "components/SpacesList";

export default async function SpaceInUserSidebar(props: {
  params: { studio: string };
  children: React.ReactNode;
}) {
  let userPageData = await getUserPageData(props.params);
  if (!userPageData.data) return null;
  return (
    <SpaceHeader
      spaces={userPageData.data.members_in_spaces.map(
        (s) => s.space_data as SpaceData
      )}
      context={{ type: "user", ...userPageData.data }}
      path={[
        {
          name: props.params.studio,
          link: `/s/${props.params.studio}`,
        },
      ]}
    />
  );
}
