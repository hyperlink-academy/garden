import { getUserPageData } from "app/(app)/s/[studio]/getUserPageData";
import { UserPageSidebar } from "./UserPageSidebar";
import { SpaceData } from "components/SpacesList";
export default async function Sidebar(props: { params: { studio: string } }) {
  let data = await getUserPageData(props.params);
  if (!data.data) return null;
  return (
    <UserPageSidebar
      {...props}
      spaces={data.data.members_in_spaces.map((s) => s.space_data as SpaceData)}
    />
  );
}
