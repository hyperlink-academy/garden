import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/router";
import { ExitDoor, Settings } from "./Icons";
import { ButtonSecondary } from "./Buttons";
import { useContext, useMemo } from "react";
import { SmallCardDragContext } from "./DragContext";
import { spacePath } from "hooks/utils";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { useSubscribe } from "replicache-react";
import Head from "next/head";
import { Fact } from "data/Facts";
import { Disclosure } from "@headlessui/react";
import { useSmoker } from "./Smoke";
import { spaceAPI } from "backend/lib/api";

export const SpaceLayout: React.FC = (props) => {
  let spaceName = useIndex.aev("this/name")[0];
  let unreads = useUnreads();
  let { session } = useAuth();
  let { query } = useRouter();

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>
      <div className="pageWrapper flex flex-col sm:gap-4 gap-2 h-screen items-stretch justify-items-center overflow-hidden">
        {/* HEADER START */}
        <div className="pageHeader shrink-0 sm:pb-4 pb-2">
          <Disclosure>
            <div
              className={`
                max-w-6xl h-12 mx-auto sm:px-4 px-2
                grid grid-cols-[max-content_auto_max-content] gap-4 items-center 
                before:content-[''] before:absolute before:w-[100vw] before:h-12 before:left-0 ${
                  unreads > 0 ? "before:bg-accent-blue" : "before:bg-grey-35"
                }`}
            >
              {!session.session ? (
                <div />
              ) : (
                <div className="self-center z-10">
                  <Link href={`$/s/{session.session.username}`}>
                    <ButtonSecondary
                      content={"studio"}
                      icon={<ExitDoor />}
                    ></ButtonSecondary>
                  </Link>
                </div>
              )}
              <div className="text-white font-bold mx-auto self-center grow z-10">
                <Link href={`${spacePath(query.studio, query.space)}`}>
                  {spaceName?.value}
                </Link>

                <Disclosure.Button className="text-white ml-2 absolute">
                  <Settings />
                </Disclosure.Button>
              </div>

              <div className="self-center z-10">
                <Link
                  href={`${spacePath(query.studio, query.space)}/highlights`}
                >
                  <ButtonSecondary content={"highlights"}></ButtonSecondary>
                </Link>
              </div>
            </div>

            <Disclosure.Panel>
              <div className="bg-white flex flex-row justify-between p-2 border border-accent-blue rounded-b-md">
                <Join />
              </div>
            </Disclosure.Panel>
          </Disclosure>
        </div>
        {/* HEADER END */}

        <div
          className={`
          pageContent 
          h-[calc(100vh-80px)] w-full max-w-6xl 
          sm:px-4 px-2 mx-auto
          overflow-x-scroll
          grow 
          relative 
          flex items-stretch `}
        >
          <SmallCardDragContext>{props.children}</SmallCardDragContext>
        </div>
      </div>
    </>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const Join = () => {
  let { session } = useAuth();
  let isMember = useIndex.ave("space/member", session.session?.studio);
  let smoker = useSmoker();
  const spaceID = useSpaceID();
  let { data: inviteLink } = useSWR(
    !isMember ? null : `${WORKER_URL}/space/${spaceID}/get_share_code`,
    async () => {
      if (!spaceID || !session.token) return;
      let code = await spaceAPI(
        `${WORKER_URL}/space/${spaceID}`,
        "get_share_code",
        {
          token: session.token,
        }
      );
      if (code.success) {
        return `${document.location.href}/join?code=${code.code}`;
      }
    }
  );

  const getShareLink = async (e: React.MouseEvent) => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    smoker({ position: { x: e.clientX, y: e.clientY }, text: "copied!" });
  };

  if (isMember && inviteLink) {
    return (
      <>
        <input readOnly value={inviteLink} className="hidden" />
        <button onClick={getShareLink}> share link</button>
      </>
    );
  }
  return null;
};

let useUnreads = () => {
  let rep = useContext(ReplicacheContext);
  let { memberEntity } = useMutations();
  let time = useMemo(() => {
    return Date.now() - 24 * 60 * 60 * 1000;
  }, []);
  return useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!memberEntity) return 0;
      let results = (await tx
        .scan({
          indexName: "at",
          prefix: `highlight/time-`,
          start: { key: `highlight/time-${time}` },
        })
        .values()
        .toArray()) as Fact<"highlight/time">[];
      let resultsWithReadStates = await Promise.all(
        results.map(async (r) => {
          let read = await scanIndex(tx).eav(r.entity, "highlight/read-by");
          return read.map((r) => r.value.value);
        })
      );
      return resultsWithReadStates.filter(
        (f) => memberEntity && !f.includes(memberEntity)
      ).length;
    },
    0,
    [memberEntity, time]
  );
};
