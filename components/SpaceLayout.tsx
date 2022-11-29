import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/router";
import { ExitDoor, ExpandTiny, Member, MemberAdd } from "./Icons";
import { SmallCardDragContext } from "./DragContext";
import { spacePath } from "hooks/utils";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import Head from "next/head";
import { Disclosure } from "@headlessui/react";
import { useSmoker } from "./Smoke";
import { spaceAPI } from "backend/lib/api";
import { Divider, Modal } from "./Layout";
import { useNextHighlight } from "hooks/useNextHighlight";
import { useState } from "react";
import { ButtonPrimary, ButtonSecondary } from "./Buttons";
import { LogInModal } from "./LoginModal";

export const SpaceLayout: React.FC = (props) => {
  let { session } = useAuth();
  let { query, pathname } = useRouter();

  let spaceName = useIndex.aev("this/name")[0];
  let newHighlightAvailable = useNextHighlight();
  let isHighlightPage = pathname.endsWith("/highlights");
  let [isInviteOpen, setIsOpen] = useState(false);
  let [isLogInOpen, setLogInOpen] = useState(false);

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>
      <div className="pageWrapper flex flex-col sm:gap-4 gap-2 h-screen items-stretch justify-items-center overflow-hidden">
        {/* HEADER START */}
        <div className="pageHeader shrink-0 sm:pb-4 pb-2">
          <div
            className={`
                max-w-6xl mx-auto sm:px-4 px-2 
                before:content-[''] before:absolute before:w-[100vw] before:h-14 before:left-0 ${
                  newHighlightAvailable
                    ? "before:bg-accent-blue"
                    : "before:bg-grey-35"
                }`}
          >
            <div className="grid grid-cols-[max-content_auto_max-content] items-center gap-2 pt-3">
              {!session.session ? (
                <div className="w-20" />
              ) : (
                <div className="z-10 w-20 ">
                  <Link href={`/s/${session.session.username}`}>
                    <div
                      className={`                  
                        ${
                          newHighlightAvailable
                            ? "text-accent-blue"
                            : "text-grey-35"
                        } py-1 px-2 w-fit rounded-md  bg-white hover:bg-bg-blue`}
                    >
                      <ExitDoor />
                    </div>
                  </Link>
                </div>
              )}
              <div className="text-white mx-auto text-center grid grid-cols-[max-content_1px_max-content] gap-4 grow  z-10">
                <h2 className="place-self-center">{spaceName?.value} </h2>

                {!session.session ? null : (
                  <>
                    <Divider />

                    <div
                      className={`${
                        newHighlightAvailable
                          ? "text-accent-blue"
                          : "text-grey-35"
                      } flex gap-2 `}
                    >
                      <div
                        className={`${
                          isHighlightPage
                            ? `bg-transparent border border-transparent hover:border hover:border-white text-white `
                            : `bg-white text-inherit font-bold`
                        } rounded-md py-1 px-2`}
                      >
                        <Link href={`${spacePath(query.studio, query.space)}`}>
                          Desktop
                        </Link>
                      </div>
                      <div
                        className={`${
                          isHighlightPage
                            ? `bg-white text-inherit font-bold`
                            : `bg-transparent border border-transparent hover:border hover:border-white text-white `
                        } rounded-md py-1 px-2`}
                      >
                        <Link
                          href={`${spacePath(
                            query.studio,
                            query.space
                          )}/highlights`}
                        >
                          Highlight
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="z-10 w-20">
                {!session.session ? (
                  <>
                    <ButtonSecondary
                      content="Log In"
                      onClick={() => setLogInOpen(!isLogInOpen)}
                    />

                    <LogInModal
                      isOpen={isLogInOpen}
                      onClose={() => setLogInOpen(false)}
                    />
                  </>
                ) : (
                  <button
                    className={`text-white float-right`}
                    onClick={() => setIsOpen(!isInviteOpen)}
                  >
                    <Member />
                  </button>
                )}
              </div>
            </div>
          </div>

          <Modal open={isInviteOpen} onClose={() => setIsOpen(false)}>
            <Join />
          </Modal>
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

const Join = () => {
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
      <div className="flex flex-col gap-4 text-center">
        <p className="font-bold">Share this link to invite new members!</p>
        <div className="w-full flex gap-2">
          <input className="grow" readOnly value={inviteLink} />
          <ButtonSecondary onClick={getShareLink} content="Copy Link" />
        </div>
      </div>
    );
  }
  return null;
};
