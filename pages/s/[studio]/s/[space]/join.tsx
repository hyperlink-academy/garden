import { spaceAPI, workerAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function JoinSpace() {
  let router = useRouter();
  let { session } = useAuth();
  let isMember = useIndex.ave("space/member", session.session?.studio);
  let code = router.query.code as string | undefined;
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
  const onClick = () => {
    if (!id?.id || !session.token || !code) return;
    spaceAPI(`${WORKER_URL}/space/${id.id}`, "join", {
      token: session.token,
      code,
    });
  };
  if (!isMember) {
    router.push(`/s/${router.query.studio}/s/${router.query.space}`);
    return <span>"you're a member!"</span>;
  }
  return <button onClick={onClick}>join this space</button>;
}
