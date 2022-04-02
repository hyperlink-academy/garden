import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function SpacePage() {
  let router = useRouter();
  let { data: id } = useSWR(
    "/studio/" + router.query.studio + "/space/" + router.query.space,
    () => {
      let id = workerAPI(WORKER_URL, "get_space", {
        studio: router.query.studio as string,
        space: router.query.space as string,
      });
      return id;
    },
    { revalidateOnFocus: false }
  );
  if (!id) return <div>loading</div>;
  if (!id.success) return <div>404 space</div>;
  return (
    <SpaceProvider id={id.id}>
      <div>Space!</div>
      <SpaceName />
    </SpaceProvider>
  );
}

const SpaceName = () => {
  let name = useIndex.aev("this/name");
  return <h2>{name?.[0]?.value}</h2>;
};
