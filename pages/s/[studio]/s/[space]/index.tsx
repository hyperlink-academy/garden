import { spaceAPI, workerAPI } from "backend/lib/api";
import { DeckList } from "components/DeckList";
import { SpaceProvider } from "components/ReplicacheProvider";
import { useAuth } from "hooks/useAuth";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import Link from "next/link";
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
      <Join />
      <SpaceName />
      <DeckList />
    </SpaceProvider>
  );
}

const SpaceName = () => {
  let name = useIndex.aev("this/name");
  return <h2>{name?.[0]?.value}</h2>;
};

const Join = () => {
  let { session } = useAuth();
  let router = useRouter();
  let isMember = useIndex.ave("space/member", session.session?.studio);
  const spaceID = useSpaceID();
  const getShareLink = async () => {
    if (!spaceID || !session.token) return;
    let code = await spaceAPI(
      `${WORKER_URL}/space/${spaceID}`,
      "get_share_code",
      {
        token: session.token,
      }
    );
    if (code.success) {
      await navigator.clipboard.writeText(
        `${document.location.href}/join?code=${code.code}`
      );
    }
  };
  if (isMember)
    return (
      <span>
        {" "}
        You're a member <button onClick={getShareLink}>get share link </button>
      </span>
    );
  return (
    <Link href={`${router.asPath}/join`}>
      <a>join</a>
    </Link>
  );
};
