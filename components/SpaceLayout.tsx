import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/router";
import { ExitDoor, MemberAdd } from "./Icons";
import { SmallCardDragContext } from "./DragContext";
import { spacePath } from "hooks/utils";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import Head from "next/head";
import { Disclosure } from "@headlessui/react";
import { useSmoker } from "./Smoke";
import { spaceAPI } from "backend/lib/api";
import { Divider } from "./Layout";
import { useNextHighlight } from "hooks/useNextHighlight";

export const SpaceLayout: React.FC = (props) => {
  let spaceName = useIndex.aev("this/name")[0];
  let highlight = useNextHighlight();
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
                max-w-6xl mx-auto sm:px-4 px-2 
                before:content-[''] before:absolute before:w-[100vw] before:h-14 before:left-0 ${
                  highlight ? "before:bg-accent-blue" : "before:bg-grey-35"
                }`}
            >
              <div className="grid grid-cols-[max-content_auto_max-content]  items-end gap-2 pt-3">
                {!session.session ? (
                  <div className="w-20" />
                ) : (
                  <div className="z-10 w-20 ">
                    <Link href={`/s/${session.session.username}`}>
                      <div className="py-1 px-2 w-fit rounded-md text-accent-blue bg-white hover:bg-bg-blue">
                        <ExitDoor />
                      </div>
                    </Link>
                  </div>
                )}
                <div className="text-white font-bold mx-auto text-center flex gap-2 grow z-10">
                  <h2>{spaceName?.value} </h2>
                  {window.location.href.endsWith("/highlights") ? (
                    <Link href={`${spacePath(query.studio, query.space)}`}>
                      <h4 className="font-normal"> See Highlight </h4>
                    </Link>
                  ) : (
                    <Link
                      href={`${spacePath(
                        query.studio,
                        query.space
                      )}/highlights`}
                    >
                      <div className="flex gap-4">
                        <div className="bg-white text-accent-blue rounded-md py-1 px-2">
                          Desktop
                        </div>
                        <Divider />
                        <div>Highlight</div>
                      </div>
                    </Link>
                  )}
                </div>

                <div className="z-10 w-20">
                  <div className="float-right text-white">
                    <MemberAdd />
                  </div>
                </div>
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

const SettingsPanel = () => {
  return <div>hello</div>;
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
