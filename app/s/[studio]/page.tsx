import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import UserHomePage from "./UserHomePage";
import { cache } from "react";

const getData = cache((studio: string) => {
  return workerAPI(WORKER_URL, "get_identity_data", {
    name: studio,
  });
});

export async function generateMetadata(props: { params: { studio: string } }) {
  let data = await getData(props.params.studio);
  return { title: data.data?.username || "404 Studio Not Found" };
}

export default async function UserStudio(props: {
  params: { studio: string };
}) {
  let data = await getData(props.params.studio);
  if (!data.success) return <div>404 - page not found!</div>;
  return (
    <div className="pwa-padding mx-auto mt-3 max-w-4xl px-3 pb-6 sm:px-4 sm:pb-8">
      <UserHomePage data={data.data} />
    </div>
  );
}
