import { spaceAPI } from "backend/lib/api";
import { ButtonLink } from "components/Buttons";
import { DeckList } from "components/DeckList";
import { useAuth } from "hooks/useAuth";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import Link from "next/link";
import { useRouter } from "next/router";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function SpacePage() {
  return (
    <>
      <div className="flex justify-between pb-4">
        <SpaceName />
        <Join />
      </div>
      <DeckList />
    </>
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
      <div className="self-center">
        <ButtonLink onClick={getShareLink} content="get share link" />
      </div>
    );
  return (
    <Link href={`${router.asPath}/join`}>
      <a>join</a>
    </Link>
  );
};
