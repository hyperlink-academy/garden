import { Disclosure } from "@headlessui/react";
import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import { Drawer } from "./DeckList";
import { Member } from "./Icons";
import { SmallCard } from "./SmallCard";

export const SpaceInfo = () => {
  let spaceName = useIndex.aev("this/name")[0];

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>
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
    </>
  );
};

const Description = (props: { entity: string }) => {
  let description = useIndex.eav(props.entity, "this/description");
  return <p className="spaceDescription text-grey-35 ">{description?.value}</p>;
};

const Members = () => {
  let members = useIndex.aev("space/member");
  let { studio, space } = useRouter().query;

  let [toggle, setToggle] = useState<boolean | undefined>(undefined);

  return (
    <div className="pb-4">
      <Disclosure>
        <button
          className="membersList grid grid-cols-[max-content_max-content] gap-2 items-center font-bold"
          onClick={() => setToggle(!toggle)}
        >
          <Member />
          <p>Members ({members.length})</p>
        </button>

        <Drawer open={!!toggle}>
          <div className="flex flex-wrap gap-4">
            {members.map((m) => (
              <SmallCard
                entityID={m.entity}
                id={m.id}
                index={0}
                parent=""
                section={""}
                href={`/s/${studio}/s/${space}/c/${m.entity}`}
              />
            ))}
          </div>
        </Drawer>
      </Disclosure>
    </div>
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
