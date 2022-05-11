import { spaceAPI, workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { useAuth } from "hooks/useAuth";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { ulid } from "src/ulid";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function JoinSpacePage() {
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
  if (!id) return <div>loading…</div>;
  if (!id.success) return <div>404 - space not found!</div>;
  return (
    <SpaceProvider id={id.id}>
      <JoinSpace id={id.id} />
    </SpaceProvider>
  );
}
function JoinSpace(props: { id: string }) {
  let { session, rep } = useAuth();
  let router = useRouter();
  let code = router.query.code as string | undefined;
  let isMember = useIndex.ave("space/member", session.session?.studio);
  const onClick = async () => {
    if (!session.token || !code || !rep || isMember) return;
    let data = await spaceAPI(`${WORKER_URL}/space/${props.id}`, "join", {
      token: session.token,
      code,
    });
    if (data.success) {
      rep.mutate.addSpace({
        studio: router.query.studio as string,
        name: router.query.space as string,
        spaceID: props.id,
        entityID: ulid(),
      });
      router.push(`/s/${router.query.studio}/s/${router.query.space}`);
    }
  };
  if (isMember)
    router.push(`/s/${router.query.studio}/s/${router.query.space}`);
  return <button onClick={onClick}>join this space</button>;
}
