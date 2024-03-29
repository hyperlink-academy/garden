import UserHomePage from "./UserHomePage";
import { getUserPageData } from "./getUserPageData";

export async function generateMetadata(props: { params: { studio: string } }) {
  let data = await getUserPageData(props.params);
  return { title: data.data?.username || "404 Studio Not Found" };
}

export default async function UserStudio(props: {
  params: { studio: string };
}) {
  let data = await getUserPageData(props.params);
  if (!data.success) return <div>404 - page not found!</div>;
  return <UserHomePage data={data.data} />;
}
