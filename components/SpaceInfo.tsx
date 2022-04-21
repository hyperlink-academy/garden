import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import Link from "next/link";
import { useRouter } from "next/router";
import { ButtonLink } from "./Buttons";
import { Member } from "./Icons";

export const SpaceInfo = () => {
  let spaceName = useIndex.aev("this/name")[0];

  return (
    <div className="spaceInfo grid auto-rows-max gap-3">
      <div className="spaceNameDescription grid auto-rows-max gap-2">
        <div className="flex justify-between pb-4">
          <h1>{spaceName?.value}</h1>
          <Join />
        </div>
        <Description entity={spaceName?.entity} />
      </div>
      <Members />
    </div>
  );
};

const Description = (props: { entity: string }) => {
  let description = useIndex.eav(props.entity, "this/description");
  return <p className="spaceDescription text-grey-35 ">{description?.value}</p>;
};

const Members = () => {
  let members = useIndex.aev("space/member");

  return (
    <button className="membersList grid grid-cols-[max-content_max-content] gap-2 items-center font-bold">
      <Member />
      <p>Members ({members.length})</p>
    </button>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
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
